import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks

from config import SOFASCORE_BASE, SOFASCORE_TOURNAMENT_ID, SOFASCORE_SEASON_ID
from cache import get_cached_or_fetch
from scraper import fetch_sofascore

log = logging.getLogger(__name__)
router = APIRouter(tags=["Artilheiros"])

@router.get(
    "/api/artilheiros",
    summary="Top artilheiros da Copa 2026",
    response_description="Lista dos maiores artilheiros do torneio.",
)
async def get_artilheiros(background_tasks: BackgroundTasks):
    CACHE_KEY = "artilheiros_copa_2026"

    async def _fetch():
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
        return resultado

    return await get_cached_or_fetch(
        CACHE_KEY,
        _fetch,
        ttl=7200,  # 2 horas
        background_tasks=background_tasks
    )
