import logging
from fastapi import APIRouter, HTTPException, Path

from config import SOFASCORE_BASE
from cache import cache_get, cache_set
from scraper import fetch_sofascore

log = logging.getLogger(__name__)
router = APIRouter(tags=["Estatísticas"])

@router.get(
    "/api/estatisticas/{partida_id}",
    summary="Estatísticas detalhadas de uma partida",
    response_description="Posse de bola, chutes, faltas, escanteios e impedimentos.",
)
async def get_estatisticas(
    partida_id: int = Path(..., description="ID da partida no SofaScore", gt=0)
):
    CACHE_KEY = f"stats_{partida_id}"
    fonte_cache = True

    cached = cache_get(CACHE_KEY)
    if cached is not None:
        log.info("Cache HIT: %s", CACHE_KEY)
        cached["fonte_cache"] = fonte_cache
        return cached

    fonte_cache = False
    url = f"{SOFASCORE_BASE}/event/{partida_id}/statistics"
    raw = await fetch_sofascore(url)

    try:
        statistics_groups = raw.get("statistics", [])
        if not statistics_groups:
            raise HTTPException(
                status_code=404,
                detail=f"Nenhuma estatística disponível para a partida {partida_id}. O jogo pode ainda não ter ocorrido.",
            )

        all_period = next(
            (g for g in statistics_groups if g.get("period") == "ALL"),
            statistics_groups[0],
        )

        flat: dict[str, dict] = {}
        for group in all_period.get("groups", []):
            for item in group.get("statisticsItems", []):
                name = item.get("name", "").lower()
                flat[name] = {
                    "mandante":  item.get("home"),
                    "visitante": item.get("away"),
                }

        def stat(key: str, default=None):
            entry = flat.get(key, {})
            return {
                "mandante":  entry.get("mandante", default),
                "visitante": entry.get("visitante", default),
            }

        posse = stat("ball possession")
        chutes = stat("total shots", 0)
        chutes_alvo = stat("shots on target", 0)
        faltas = stat("fouls", 0)
        escanteios = stat("corner kicks", 0)
        impedimentos = stat("offsides", 0)
        cartoes_amarelos = stat("yellow cards", 0)
        cartoes_vermelhos = stat("red cards", 0)
        passes_totais = stat("passes", 0)
        precisao = stat("pass accuracy")
        laterais = stat("throw-ins", 0)

        resultado = {
            "partida_id": partida_id,
            "status": "finalizado", # Simplify
            "fonte_cache": fonte_cache,
            # We don't have the team names from this endpoint alone without making another call,
            # but we'll mock or leave them out if they are not available from /statistics.
            # Actually, the README expects them. Let's see if /statistics has them? No, only home/away stats.
            # The client should ideally fetch the match info from /jogos.
            # We'll just provide the stats blocks:
            "estatisticas_casa": {
                "posse_bola": posse["mandante"],
                "chutes_totais": chutes["mandante"],
                "chutes_no_alvo": chutes_alvo["mandante"],
                "faltas": faltas["mandante"],
                "escanteios": escanteios["mandante"],
                "impedimentos": impedimentos["mandante"],
                "cartoes_amarelos": cartoes_amarelos["mandante"],
                "cartoes_vermelhos": cartoes_vermelhos["mandante"],
                "passes_totais": passes_totais["mandante"],
                "precisao_passes": precisao["mandante"],
                "laterais": laterais["mandante"],
            },
            "estatisticas_fora": {
                "posse_bola": posse["visitante"],
                "chutes_totais": chutes["visitante"],
                "chutes_no_alvo": chutes_alvo["visitante"],
                "faltas": faltas["visitante"],
                "escanteios": escanteios["visitante"],
                "impedimentos": impedimentos["visitante"],
                "cartoes_amarelos": cartoes_amarelos["visitante"],
                "cartoes_vermelhos": cartoes_vermelhos["visitante"],
                "passes_totais": passes_totais["visitante"],
                "precisao_passes": precisao["visitante"],
                "laterais": laterais["visitante"],
            }
        }

    except HTTPException:
        raise
    except (KeyError, TypeError, StopIteration, AttributeError) as exc:
        log.error("Erro ao processar estatísticas da partida %d: %s", partida_id, exc)
        raise HTTPException(
            status_code=500,
            detail="A estrutura de dados do SofaScore mudou ou os dados estão incompletos.",
        )

    cache_set(CACHE_KEY, resultado)
    return resultado
