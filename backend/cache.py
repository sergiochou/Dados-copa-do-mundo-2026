import time
import json
import os
import hashlib
import logging
from typing import Any, Callable, Awaitable
from fastapi import BackgroundTasks

log = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache_files")
os.makedirs(CACHE_DIR, exist_ok=True)

# Cache em memória: {key: {"value": value, "expires_at": float}}
_memory_cache: dict[str, dict] = {}
# Chaves atualmente sendo revalidadas em segundo plano para evitar concorrência redundante
_revalidating_keys: set[str] = set()

def _get_cache_path(key: str) -> str:
    """Retorna o caminho do arquivo de cache correspondente à chave."""
    key_hash = hashlib.md5(key.encode("utf-8")).hexdigest()
    return os.path.join(CACHE_DIR, f"{key_hash}.json")

def cache_get(key: str, allow_expired: bool = False) -> Any | None:
    """Retorna o valor associado à chave, da memória ou do disco."""
    now = time.time()
    
    # 1. Tenta obter do cache em memória
    if key in _memory_cache:
        entry = _memory_cache[key]
        if not allow_expired and now >= entry["expires_at"]:
            log.info("Cache em memória expirado para chave: %s", key)
        else:
            return entry["value"]

    # 2. Tenta obter do cache em disco
    path = _get_cache_path(key)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                payload = json.load(f)
            
            val = payload.get("data")
            exp = payload.get("expires_at", 0)
            
            # Sincroniza de volta na memória para agilizar leituras futuras
            _memory_cache[key] = {"value": val, "expires_at": exp}
            
            if not allow_expired and now >= exp:
                log.info("Cache em disco expirado para chave: %s", key)
                return None
            return val
        except Exception as e:
            log.error("Erro ao ler cache em disco para chave %s: %s", key, e)
            
    return None

def _make_serializable(obj: Any) -> Any:
    """Converte recursivamente objetos (como Pydantic models) em tipos nativos do Python serializáveis em JSON."""
    if isinstance(obj, list):
        return [_make_serializable(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _make_serializable(v) for k, v in obj.items()}
    if hasattr(obj, "model_dump") and callable(obj.model_dump):
        return _make_serializable(obj.model_dump())
    if hasattr(obj, "dict") and callable(obj.dict):
        return _make_serializable(obj.dict())
    return obj

def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    """Armazena o valor no cache de memória e escreve atomicamente no disco."""
    now = time.time()
    expires_at = now + ttl
    
    # Salva na memória
    _memory_cache[key] = {"value": value, "expires_at": expires_at}
    
    # Salva no disco
    path = _get_cache_path(key)
    serializable_value = _make_serializable(value)
    payload = {
        "key": key,
        "created_at": now,
        "expires_at": expires_at,
        "ttl": ttl,
        "data": serializable_value
    }
    
    temp_path = path + ".tmp"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.replace(temp_path, path)
        log.info("Cache gravado com sucesso: chave='%s' | TTL: %ds | expira em: %ds", key, ttl, int(expires_at - now))
    except Exception as e:
        log.error("Erro ao salvar cache em disco para chave %s: %s", key, e)
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

def cache_clear() -> int:
    """Remove todas as entradas da memória e todos os arquivos de cache do disco."""
    count = 0
    _memory_cache.clear()
    _revalidating_keys.clear()
    
    if os.path.exists(CACHE_DIR):
        for name in os.listdir(CACHE_DIR):
            if name.endswith(".json"):
                path = os.path.join(CACHE_DIR, name)
                try:
                    os.remove(path)
                    count += 1
                except Exception as e:
                    log.error("Erro ao remover arquivo de cache %s: %s", path, e)
    log.info("Cache limpo manualmente. %d arquivos de cache removidos.", count)
    return count

def get_cache_status() -> dict:
    """Retorna estatísticas detalhadas sobre o estado do cache em memória e em disco."""
    disk_files = []
    total_bytes = 0
    if os.path.exists(CACHE_DIR):
        for name in os.listdir(CACHE_DIR):
            if name.endswith(".json"):
                path = os.path.join(CACHE_DIR, name)
                try:
                    stat = os.stat(path)
                    total_bytes += stat.st_size
                    disk_files.append(name)
                except Exception:
                    pass
    return {
        "memoria_entradas_ativas": len(_memory_cache),
        "memoria_chaves": list(_memory_cache.keys()),
        "disco_arquivos_total": len(disk_files),
        "disco_tamanho_bytes": total_bytes,
        "disco_pasta": CACHE_DIR,
    }

async def _revalidate_task(key: str, fetch_func: Callable[[], Awaitable[Any]], ttl: int | Callable[[Any], int]) -> None:
    """Rotina assíncrona para atualizar o cache sem travar o client HTTP."""
    try:
        log.info("Iniciando revalidação em segundo plano para: %s", key)
        new_value = await fetch_func()
        actual_ttl = ttl(new_value) if callable(ttl) else ttl
        cache_set(key, new_value, actual_ttl)
        log.info("Revalidação em segundo plano finalizada para: %s", key)
    except Exception as e:
        log.error("Falha na revalidação em segundo plano para chave %s: %s", key, e)
    finally:
        _revalidating_keys.discard(key)

async def get_cached_or_fetch(
    key: str,
    fetch_func: Callable[[], Awaitable[Any]],
    ttl: int | Callable[[Any], int],
    background_tasks: BackgroundTasks | None = None
) -> Any:
    """
    Retorna o valor do cache se existir. 
    Se estiver expirado e background_tasks for fornecido, responde imediatamente com os 
    dados antigos (stale) e inicia uma revalidação em segundo plano.
    Se não houver cache nenhum, faz a busca síncrona.
    """
    # 1. Tenta obter cache válido (fresco)
    cached_fresh = cache_get(key, allow_expired=False)
    if cached_fresh is not None:
        return cached_fresh

    # 2. Se não estiver fresco, tenta obter cache expirado (stale)
    cached_stale = cache_get(key, allow_expired=True)
    if cached_stale is not None:
        if background_tasks is not None:
            if key not in _revalidating_keys:
                _revalidating_keys.add(key)
                background_tasks.add_task(_revalidate_task, key, fetch_func, ttl)
                log.info("Retornando cache stale para '%s' e disparando atualização assíncrona.", key)
            else:
                log.info("Retornando cache stale para '%s'; atualização assíncrona já em andamento.", key)
            return cached_stale
        else:
            log.info("Cache expirado para '%s'. Nenhuma fila de segundo plano informada; buscando síncrono.", key)

    # 3. Cache MISS total ou revalidação síncrona obrigatória
    log.info("Cache MISS absoluto para chave: %s. Buscando dados novos de forma síncrona.", key)
    new_value = await fetch_func()
    actual_ttl = ttl(new_value) if callable(ttl) else ttl
    cache_set(key, new_value, actual_ttl)
    return new_value

