import asyncio
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks

from config import SOFASCORE_BASE, SOFASCORE_TOURNAMENT_ID, SOFASCORE_SEASON_ID
from cache import cache_get, cache_set, get_cached_or_fetch
from scraper import fetch_sofascore

log = logging.getLogger(__name__)
router = APIRouter(tags=["Grupos"])

# Limita a concorrência a no máximo 3 requisições simultâneas para evitar HTTP 429
sem = asyncio.Semaphore(3)

async def fetch_team_stats(team_id: int) -> dict:
    """Busca estatísticas acumuladas do time no torneio, com cache em disco e retry em falhas."""
    if not team_id:
        return {}
    CACHE_KEY = f"team_stats_{team_id}"

    async def _fetch():
        url = f"{SOFASCORE_BASE}/team/{team_id}/unique-tournament/{SOFASCORE_TOURNAMENT_ID}/season/{SOFASCORE_SEASON_ID}/statistics/overall"
        stats = {}
        success = False
        
        # 3 tentativas com backoff se houver falha de rede/limite de taxa
        for attempt in range(3):
            async with sem:
                try:
                    if attempt > 0:
                        await asyncio.sleep(0.5 * attempt)
                    else:
                        await asyncio.sleep(0.05)
                    
                    data = await fetch_sofascore(url)
                    stats = data.get("statistics", {})
                    success = True
                    break
                except Exception as exc:
                    log.warning("Tentativa %d falhou ao buscar estatísticas do time %d: %s", attempt + 1, team_id, exc)
                    
        if not success:
            raise HTTPException(
                status_code=502,
                detail=f"Não foi possível buscar as estatísticas para o time {team_id}.",
            )
        return stats

    return await get_cached_or_fetch(
        CACHE_KEY,
        _fetch,
        ttl=14400,  # 4 horas
        background_tasks=None  # será executado de forma síncrona dentro da revalidação em segundo plano do grupo
    )

@router.get(
    "/api/grupos",
    summary="Classificação dos grupos da Copa 2026",
    response_description="Tabela de classificação de cada grupo.",
)
async def get_grupos(background_tasks: BackgroundTasks):
    CACHE_KEY = "grupos_copa_2026"

    async def _fetch_and_format():
        url = f"{SOFASCORE_BASE}/unique-tournament/{SOFASCORE_TOURNAMENT_ID}/season/{SOFASCORE_SEASON_ID}/standings/total"
        raw = await fetch_sofascore(url)

        try:
            standings = raw.get("standings", [])
            
            # Coleta todas as linhas para buscar estatísticas em paralelo
            rows_to_process = []
            for grupo in standings:
                for row in grupo.get("rows", []):
                    team_id = row.get("team", {}).get("id")
                    if team_id:
                        rows_to_process.append(team_id)

            # Dispara todas as requisições em paralelo
            stats_results = await asyncio.gather(*(fetch_team_stats(tid) for tid in rows_to_process))
            
            # Mapeia ID do time -> estatísticas
            stats_map = {tid: stats_results[i] for i, tid in enumerate(rows_to_process)}

            grupos = []
            for grupo in standings:
                nome_grupo = grupo.get("name") or f"Grupo {grupo.get('id', '?')}"
                times = []
                for row in grupo.get("rows", []):
                    team = row.get("team", {})
                    tid = team.get("id")
                    t_stats = stats_map.get(tid, {})

                    times.append({
                        "posicao":  row.get("position"),
                        "id":       tid,
                        "nome":     team.get("name"),
                        "sigla":    team.get("nameCode"),
                        "jogos":    row.get("matches"),
                        "vitorias": row.get("wins"),
                        "empates":  row.get("draws"),
                        "derrotas": row.get("losses"),
                        "gp":       row.get("scoresFor"),
                        "gc":       row.get("scoresAgainst"),
                        "sg":       row.get("scoresFor", 0) - row.get("scoresAgainst", 0),
                        "pontos":   row.get("points"),
                        # Estatísticas profundas solicitadas:
                        "media_posse_bola": t_stats.get("averageBallPossession") or t_stats.get("ballPossession"),
                        "total_chutes": t_stats.get("shots") or t_stats.get("totalShots"),
                        "chutes_no_alvo": t_stats.get("shotsOnTarget"),
                        "escanteios": t_stats.get("corners") or t_stats.get("cornerKicks"),
                        "faltas_cometidas": t_stats.get("fouls"),
                        "cartoes_amarelos": t_stats.get("yellowCards"),
                        "cartoes_vermelhos": t_stats.get("redCards"),
                        "gols_sofridos": t_stats.get("goalsConceded"),
                        "chutes_sofridos": t_stats.get("shotsAgainst"),
                        "chutes_no_alvo_sofridos": t_stats.get("shotsOnTargetAgainst"),
                        "laterais": t_stats.get("throwIns"),
                        "impedimentos": t_stats.get("offsides"),
                        "passes": t_stats.get("totalPasses"),
                    })
                grupos.append({"grupo": nome_grupo, "classificacao": times})
        except (KeyError, TypeError, AttributeError) as exc:
            log.error("Erro ao processar grupos: %s", exc)
            raise HTTPException(
                status_code=500,
                detail="Não foi possível processar a classificação dos grupos.",
            )

        return grupos

    return await get_cached_or_fetch(
        CACHE_KEY,
        _fetch_and_format,
        ttl=7200,  # 2 horas
        background_tasks=background_tasks
    )

@router.get(
    "/api/selecoes/{team_id}/ano-2026",
    summary="Estatísticas e jogos do ano 2026 de uma seleção",
)
async def get_stats_ano_2026(team_id: int, background_tasks: BackgroundTasks):
    from routers.estatisticas import get_estatisticas
    from datetime import datetime, timezone, timedelta

    CACHE_KEY = f"team_stats_2026_{team_id}"

    async def _fetch():
        url = f"{SOFASCORE_BASE}/team/{team_id}/events/last/0"
        data = await fetch_sofascore(url)
        events = data.get("events", [])
        
        events_2026 = []
        for ev in events:
            start_time = ev.get("startTimestamp")
            if start_time:
                dt = datetime.fromtimestamp(start_time, tz=timezone.utc)
                if dt.year == 2026:
                    events_2026.append(ev)

        # Fetch statistics for all 2026 matches in parallel
        async def fetch_safe_stats(ev_id: int):
            try:
                # Passa background_tasks=None pois já estamos rodando de forma assíncrona/background
                return await get_estatisticas(ev_id, background_tasks=None)
            except Exception:
                return None

        stats_results = await asyncio.gather(*(fetch_safe_stats(ev.get("id")) for ev in events_2026))

        # Aggregate stats
        total_posse = 0
        total_chutes = 0
        total_chutes_no_alvo = 0
        total_escanteios = 0
        total_faltas = 0
        total_cartoes_amarelos = 0
        total_cartoes_vermelhos = 0
        
        total_gols_feitos = 0
        total_gols_sofridos = 0
        total_chutes_sofridos = 0
        total_chutes_no_alvo_sofridos = 0

        total_laterais = 0
        total_impedimentos = 0
        total_passes = 0
        
        valid_matches = 0

        def parse_posse(val) -> float:
            if val is None:
                return 50.0
            if isinstance(val, str):
                val = val.replace("%", "")
            try:
                return float(val)
            except ValueError:
                return 50.0

        def parse_num(val) -> float:
            if val is None:
                return 0.0
            try:
                return float(val)
            except ValueError:
                return 0.0

        for ev, stats in zip(events_2026, stats_results):
            if not stats:
                continue
            valid_matches += 1
            is_home = ev.get("homeTeam", {}).get("id") == team_id
            
            casa = stats.get("estatisticas_casa", {})
            fora = stats.get("estatisticas_fora", {})
            
            p_home = parse_posse(casa.get("posse_bola"))
            p_away = parse_posse(fora.get("posse_bola"))
            
            ch_home = parse_num(casa.get("chutes_totais"))
            ch_away = parse_num(fora.get("chutes_totais"))
            
            al_home = parse_num(casa.get("chutes_no_alvo"))
            al_away = parse_num(fora.get("chutes_no_alvo"))
            
            esc_home = parse_num(casa.get("escanteios"))
            esc_away = parse_num(fora.get("escanteios"))
            
            fal_home = parse_num(casa.get("faltas"))
            fal_away = parse_num(fora.get("faltas"))
            
            am_home = parse_num(casa.get("cartoes_amarelos"))
            am_away = parse_num(fora.get("cartoes_amarelos"))
            
            vm_home = parse_num(casa.get("cartoes_vermelhos"))
            vm_away = parse_num(fora.get("cartoes_vermelhos"))

            lat_home = parse_num(casa.get("laterais"))
            lat_away = parse_num(fora.get("laterais"))

            imp_home = parse_num(casa.get("impedimentos"))
            imp_away = parse_num(fora.get("impedimentos"))

            pass_home = parse_num(casa.get("passes_totais"))
            pass_away = parse_num(fora.get("passes_totais"))
            
            goals_home = parse_num(ev.get("homeScore", {}).get("current"))
            goals_away = parse_num(ev.get("awayScore", {}).get("current"))
            
            if is_home:
                total_posse += p_home
                total_chutes += ch_home
                total_chutes_no_alvo += al_home
                total_escanteios += esc_home
                total_faltas += fal_home
                total_cartoes_amarelos += am_home
                total_cartoes_vermelhos += vm_home
                
                total_gols_feitos += goals_home
                total_gols_sofridos += goals_away
                total_chutes_sofridos += ch_away
                total_chutes_no_alvo_sofridos += al_away

                total_laterais += lat_home
                total_impedimentos += imp_home
                total_passes += pass_home
            else:
                total_posse += p_away
                total_chutes += ch_away
                total_chutes_no_alvo += al_away
                total_escanteios += esc_away
                total_faltas += fal_away
                total_cartoes_amarelos += am_away
                total_cartoes_vermelhos += vm_away
                
                total_gols_feitos += goals_away
                total_gols_sofridos += goals_home
                total_chutes_sofridos += ch_home
                total_chutes_no_alvo_sofridos += al_home

                total_laterais += lat_away
                total_impedimentos += imp_away
                total_passes += pass_away

        stats_agg = {}
        if valid_matches > 0:
            stats_agg = {
                "jogos_jogados": valid_matches,
                "media_posse_bola": total_posse / valid_matches,
                "gols_feitos": total_gols_feitos / valid_matches,
                "gols_sofridos": total_gols_sofridos / valid_matches,
                "total_chutes": total_chutes / valid_matches,
                "chutes_no_alvo": total_chutes_no_alvo / valid_matches,
                "chutes_sofridos": total_chutes_sofridos / valid_matches,
                "chutes_no_alvo_sofridos": total_chutes_no_alvo_sofridos / valid_matches,
                "escanteios": total_escanteios / valid_matches,
                "faltas_cometidas": total_faltas / valid_matches,
                "cartoes_amarelos": total_cartoes_amarelos / valid_matches,
                "cartoes_vermelhos": total_cartoes_vermelhos / valid_matches,
                "laterais": total_laterais / valid_matches,
                "impedimentos": total_impedimentos / valid_matches,
                "passes": total_passes / valid_matches,
            }

        tz_brasilia = timezone(timedelta(hours=-3))
        
        jogos_retornados = []
        STATUS_MAP = {
            "finished":    "Encerrado",
            "notstarted":  "Não iniciado",
            "inprogress":  "Ao vivo",
            "postponed":   "Adiado",
            "canceled":    "Cancelado",
            "halftime":    "Intervalo",
        }
        
        for ev in events_2026:
            start_time = ev.get("startTimestamp")
            dt_str = "N/A"
            if start_time:
                dt = datetime.fromtimestamp(start_time, tz=tz_brasilia)
                dt_str = dt.strftime("%Y-%m-%dT%H:%M:%S-03:00")
                
            status_type = ev.get("status", {}).get("type", "")
            status_pt = STATUS_MAP.get(status_type, status_type)
            
            jogos_retornados.append({
                "id": ev.get("id"),
                "data": dt_str,
                "torneio": ev.get("tournament", {}).get("name"),
                "status": status_pt,
                "mandante": {
                    "id": ev.get("homeTeam", {}).get("id"),
                    "nome": ev.get("homeTeam", {}).get("name"),
                    "sigla": ev.get("homeTeam", {}).get("nameCode"),
                    "placar": ev.get("homeScore", {}).get("current")
                },
                "visitante": {
                    "id": ev.get("awayTeam", {}).get("id"),
                    "nome": ev.get("awayTeam", {}).get("name"),
                    "sigla": ev.get("awayTeam", {}).get("nameCode"),
                    "placar": ev.get("awayScore", {}).get("current")
                }
            })

        # Ordena decrescente por data (jogos mais recentes primeiro)
        jogos_retornados.sort(key=lambda x: x["data"], reverse=True)

        return {
            "selecao_id": team_id,
            "estatisticas": stats_agg,
            "jogos": jogos_retornados
        }

    return await get_cached_or_fetch(
        CACHE_KEY,
        _fetch,
        ttl=14400,  # 4 horas
        background_tasks=background_tasks
    )
