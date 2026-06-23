import logging
from fastapi import APIRouter, HTTPException

from config import SOFASCORE_BASE, SOFASCORE_TOURNAMENT_ID, SOFASCORE_SEASON_ID
from cache import cache_get, cache_set
from scraper import fetch_sofascore

log = logging.getLogger(__name__)
router = APIRouter(tags=["Artilheiros"])

@router.get(
    "/api/artilheiros",
    summary="Top artilheiros da Copa 2026",
    response_description="Lista dos maiores artilheiros do torneio.",
)
async def get_artilheiros():
    CACHE_KEY = "artilheiros_copa_2026"

    cached = cache_get(CACHE_KEY)
    if cached is not None:
        log.info("Cache HIT: %s", CACHE_KEY)
        return cached

    url = f"{SOFASCORE_BASE}/unique-tournament/{SOFASCORE_TOURNAMENT_ID}/season/{SOFASCORE_SEASON_ID}/statistics?limit=10&order=-goals&group=summary"
    raw = await fetch_sofascore(url)

    try:
        results = raw.get("results", [])
        resultado = []
        for entry in results:
            player = entry.get("player", {})
            team   = entry.get("team", {})
            resultado.append({
                "posicao":  len(resultado) + 1,
                "jogador_id": player.get("id"),
                "nome":     player.get("name"),
                "time_id":  team.get("id"),
                "time":     team.get("name"),
                "sigla":    team.get("nameCode"),
                "gols":     entry.get("goals", 0),
                "jogos":    entry.get("appearances", 0),
            })
    except (KeyError, TypeError, AttributeError) as exc:
        log.error("Erro ao processar artilheiros: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Não foi possível processar os dados de artilheiros.",
        )

    cache_set(CACHE_KEY, resultado)
    return resultado
