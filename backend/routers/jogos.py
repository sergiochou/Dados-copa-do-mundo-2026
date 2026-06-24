import asyncio
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, BackgroundTasks

from config import SOFASCORE_BASE, SOFASCORE_TOURNAMENT_ID, SOFASCORE_SEASON_ID
from cache import get_cached_or_fetch, cache_get
from scraper import fetch_sofascore, safe_get
from models import RespostaJogos, JogoSimples, TimeInfo

log = logging.getLogger(__name__)
router = APIRouter(tags=["Jogos"])

sem = asyncio.Semaphore(3)

async def fetch_page(url: str) -> dict:
    async with sem:
        try:
            return await fetch_sofascore(url)
        except Exception as e:
            log.error("Erro ao buscar página %s: %s", url, e)
            return {"events": []}


def fmt_date(timestamp: int | None) -> str:
    """Converte timestamp Unix para string ISO 8601 no fuso de Brasília (UTC-3)."""
    if not timestamp:
        return "N/A"
    tz_brasilia = timezone(timedelta(hours=-3))
    dt = datetime.fromtimestamp(timestamp, tz=tz_brasilia)
    return dt.strftime("%Y-%m-%dT%H:%M:%S-03:00")

@router.get(
    "/api/jogos",
    summary="Lista de jogos da Copa do Mundo 2026",
    response_description="Lista simplificada de partidas com ID, times, placar e data.",
    response_model=RespostaJogos,
)
async def get_jogos(background_tasks: BackgroundTasks):
    CACHE_KEY = "jogos_copa_2026"

    async def _fetch_and_format():
        base_url = f"{SOFASCORE_BASE}/unique-tournament/{SOFASCORE_TOURNAMENT_ID}/season/{SOFASCORE_SEASON_ID}"
        
        endpoints = [
            "events/last/0",
            "events/last/1",
            "events/next/0",
            "events/next/1",
            "events/next/2"
        ]
        
        tasks = [fetch_page(f"{base_url}/{ep}") for ep in endpoints]
        pages = await asyncio.gather(*tasks)
        
        todos_eventos = []
        eventos_vistos = set()
        for p in pages:
            for ev in p.get("events", []):
                ev_id = ev.get("id")
                if ev_id and ev_id not in eventos_vistos:
                    eventos_vistos.add(ev_id)
                    todos_eventos.append(ev)

        if not todos_eventos:
            raise HTTPException(status_code=404, detail="Nenhuma partida encontrada para a Copa 2026.")

        STATUS_MAP = {
            "finished":    "Encerrado",
            "notstarted":  "Não iniciado",
            "inprogress":  "Ao vivo",
            "postponed":   "Adiado",
            "canceled":    "Cancelado",
            "halftime":    "Intervalo",
        }

        try:
            resultado = []
            for ev in todos_eventos:
                status_code = safe_get(ev, "status", "type", default="")
                r_name = safe_get(ev, "roundInfo", "name")
                r_round = safe_get(ev, "roundInfo", "round")
                rodada_str = str(r_name if r_name is not None else (r_round if r_round is not None else ""))
                resultado.append(JogoSimples(
                    id=ev.get("id"),
                    rodada=rodada_str,
                    data=fmt_date(safe_get(ev, "startTimestamp")),
                    status=STATUS_MAP.get(status_code, status_code),
                    mandante=TimeInfo(
                        id=safe_get(ev, "homeTeam", "id"),
                        nome=safe_get(ev, "homeTeam", "name"),
                        sigla=safe_get(ev, "homeTeam", "nameCode"),
                    ),
                    visitante=TimeInfo(
                        id=safe_get(ev, "awayTeam", "id"),
                        nome=safe_get(ev, "awayTeam", "name"),
                        sigla=safe_get(ev, "awayTeam", "nameCode"),
                    ),
                    placar_mandante=safe_get(ev, "homeScore", "current"),
                    placar_visitante=safe_get(ev, "awayScore", "current"),
                ))
        except (KeyError, TypeError, AttributeError) as exc:
            log.error("Erro ao processar estrutura de jogos: %s", exc)
            raise HTTPException(
                status_code=500,
                detail="A estrutura de dados do SofaScore mudou. Contate o mantenedor da API.",
            )

        # Ordena por data crescente
        resultado.sort(key=lambda x: x.data if x.data else "")
        return resultado

    def get_ttl_for_jogos(jogos_list: list) -> int:
        for j in jogos_list:
            status = j.get("status") if isinstance(j, dict) else getattr(j, "status", None)
            if status in ["Ao vivo", "Intervalo"]:
                return 120  # 2 minutos
        return 7200  # 2 horas se não houver jogos ao vivo

    fonte_cache = cache_get(CACHE_KEY, allow_expired=True) is not None

    jogos_resultado = await get_cached_or_fetch(
        CACHE_KEY,
        _fetch_and_format,
        ttl=get_ttl_for_jogos,
        background_tasks=background_tasks
    )

    return {"total": len(jogos_resultado), "fonte_cache": fonte_cache, "jogos": jogos_resultado}
