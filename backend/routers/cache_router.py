import logging
from fastapi import APIRouter

from cache import get_cache_status, cache_clear

log = logging.getLogger(__name__)
router = APIRouter(tags=["Diagnóstico"])

@router.get(
    "/cache/info",
    summary="Status do cache em memória",
)
async def cache_status_route():
    """Retorna informações sobre o estado atual do cache."""
    return get_cache_status()

@router.delete(
    "/cache/limpar",
    summary="Limpa o cache em memória",
)
async def cache_clear_route():
    """Invalida todas as entradas do cache forçando novas buscas no SofaScore."""
    count = cache_clear()
    return {"mensagem": f"Cache limpo com sucesso. {count} entradas removidas."}
