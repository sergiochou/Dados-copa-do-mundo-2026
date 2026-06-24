import logging
from fastapi import APIRouter, HTTPException, Path, BackgroundTasks

from config import SOFASCORE_BASE
from cache import get_cached_or_fetch, cache_get
from scraper import fetch_sofascore

log = logging.getLogger(__name__)
router = APIRouter(tags=["Estatísticas"])

@router.get(
    "/api/estatisticas/{partida_id}",
    summary="Estatísticas detalhadas de uma partida",
    response_description="Posse de bola, chutes, faltas, escanteios e impedimentos.",
)
async def get_estatisticas(
    partida_id: int = Path(..., description="ID da partida no SofaScore", gt=0),
    background_tasks: BackgroundTasks | None = None
):
    CACHE_KEY = f"stats_{partida_id}"

    async def _fetch():
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

            # O valor final do dict será salvo em cache.
            # Não injetamos fonte_cache fixo aqui porque vamos determiná-lo na resposta da rota.
            resultado = {
                "partida_id": partida_id,
                "status": "finalizado", # Mantido do design original
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
            return resultado

        except HTTPException:
            raise
        except (KeyError, TypeError, StopIteration, AttributeError) as exc:
            log.error("Erro ao processar estatísticas da partida %d: %s", partida_id, exc)
            raise HTTPException(
                status_code=500,
                detail="A estrutura de dados do SofaScore mudou ou os dados estão incompletos.",
            )

    def get_ttl_for_match(data: dict) -> int:
        try:
            # Tenta ler a lista de jogos do cache (estrita ou expirada) para saber o status do jogo
            jogos = cache_get("jogos_copa_2026", allow_expired=True)
            if jogos:
                for j in jogos:
                    jid = j.get("id") if isinstance(j, dict) else getattr(j, "id", None)
                    if jid == partida_id:
                        status = j.get("status") if isinstance(j, dict) else getattr(j, "status", None)
                        if status == "Encerrado":
                            return 31536000  # 365 dias (partida encerrada não muda mais de estatísticas)
                        elif status in ["Ao vivo", "Intervalo"]:
                            return 60  # 1 minuto se estiver ao vivo
                        else:
                            return 3600  # 1 hora se não iniciada
        except Exception as e:
            log.warning("Erro ao tentar descobrir TTL da partida %d pela lista de jogos: %s", partida_id, e)
        return 300  # Default 5 minutos

    fonte_cache = cache_get(CACHE_KEY, allow_expired=True) is not None

    resultado = await get_cached_or_fetch(
        CACHE_KEY,
        _fetch,
        ttl=get_ttl_for_match,
        background_tasks=background_tasks
    )

    # Injeta a fonte_cache na resposta (o cache em disco salva sem essa chave dinâmica para que possamos ajustá-la)
    # Criamos uma cópia rasa para não modificar o objeto em cache caso seja em memória
    resposta = dict(resultado)
    resposta["fonte_cache"] = fonte_cache
    return resposta
