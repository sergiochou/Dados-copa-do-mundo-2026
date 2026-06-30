# config.py

# ID do torneio da Copa do Mundo FIFA no SofaScore
SOFASCORE_TOURNAMENT_ID = 16
# ID da temporada 2026 (Copa do Mundo 2026)
SOFASCORE_SEASON_ID = 58210

SOFASCORE_BASE = "https://api.sofascore.com/api/v1"

import os

# Chave do ScraperAPI para contornar o bloqueio do Cloudflare
SCRAPER_API_KEY = os.environ.get("SCRAPER_API_KEY", "6f63dc2934fd3997339695bd89ee89ac")

# Headers que simulam um navegador real para evitar bloqueios (403/Cloudflare)
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.sofascore.com/",
    "Origin": "https://www.sofascore.com",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "DNT": "1",
    "Connection": "keep-alive",
}
