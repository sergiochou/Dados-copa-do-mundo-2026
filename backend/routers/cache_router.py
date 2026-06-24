import logging
from fastapi import APIRouter

from cache import get_cache_status, cache_clear

log = logging.getLogger(__name__)
router = APIRouter(tags=["Diagnóstico"])

@router.get(
    "/cache/info",
    summary="Status do cache em memória e disco",
)
async def cache_status_route():
    """Retorna informações sobre o estado atual do cache em memória e disco local."""
    return get_cache_status()

@router.delete(
    "/cache/limpar",
    summary="Limpa o cache em memória e disco",
)
async def cache_clear_route():
    """Invalida todas as entradas do cache em memória e disco forçando novas buscas no SofaScore."""
    count = cache_clear()
    return {"mensagem": f"Cache limpo com sucesso. {count} arquivos de cache removidos do disco."}
