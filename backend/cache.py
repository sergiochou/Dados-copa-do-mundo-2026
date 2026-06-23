import logging
from typing import Any
from cachetools import TTLCache

log = logging.getLogger(__name__)

# maxsize=100  → guarda até 100 entradas distintas
# ttl=300      → cada entrada expira após 5 minutos (300 segundos)
_cache: TTLCache = TTLCache(maxsize=100, ttl=300)

def cache_get(key: str) -> Any | None:
    """Retorna valor do cache, ou None se não existir / expirado."""
    return _cache.get(key)

def cache_set(key: str, value: Any) -> None:
    """Armazena valor no cache com a chave fornecida."""
    _cache[key] = value
    log.info("Cache atualizado: chave='%s' | entradas ativas: %d", key, len(_cache))

def cache_clear() -> int:
    """Invalida todas as entradas do cache e retorna a quantidade de itens removidos."""
    count = len(_cache)
    _cache.clear()
    log.info("Cache limpo manualmente. %d entradas removidas.", count)
    return count

def get_cache_status() -> dict:
    return {
        "entradas_ativas": len(_cache),
        "capacidade_maxima": _cache.maxsize,
        "ttl_segundos": _cache.ttl,
        "chaves": list(_cache.keys()),
    }
