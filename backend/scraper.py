import httpx
import logging
import urllib.parse
from fastapi import HTTPException
from config import BROWSER_HEADERS, SCRAPER_API_KEY

log = logging.getLogger(__name__)

# O mesmo cliente é reaproveitado entre requisições para reutilizar conexões TCP
_http_client: httpx.AsyncClient | None = None

async def get_http_client() -> httpx.AsyncClient:
    """Retorna (ou cria) um cliente httpx persistente com timeout de 20s."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            headers=BROWSER_HEADERS,
            timeout=httpx.Timeout(20.0),
            follow_redirects=True,
        )
    return _http_client

async def fetch_sofascore(url: str) -> dict:
    """
    Faz uma requisição GET ao SofaScore passando pelo ScraperAPI para contornar o Cloudflare.
    Levanta HTTPException com status adequado em caso de falha.
    """
    client = await get_http_client()
    
    # Prepara a URL do ScraperAPI
    encoded_url = urllib.parse.quote(url)
    scraper_url = f"http://api.scraperapi.com?api_key={SCRAPER_API_KEY}&url={encoded_url}"
    
    try:
        log.info("Requisição SofaScore via ScraperAPI → %s", url)
        response = await client.get(scraper_url)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        log.error("SofaScore retornou HTTP %d para %s", status, url)
        if status == 404:
            raise HTTPException(status_code=404, detail="Recurso não encontrado no SofaScore.")
        raise HTTPException(
            status_code=502,
            detail=f"SofaScore retornou erro HTTP {status}. Tente novamente em breve.",
        )
    except httpx.TimeoutException:
        log.error("Timeout ao acessar %s", url)
        raise HTTPException(status_code=504, detail="Tempo limite esgotado ao acessar o SofaScore.")
    except httpx.RequestError as exc:
        log.error("Erro de rede ao acessar %s: %s", url, exc)
        raise HTTPException(status_code=502, detail="Falha de rede ao comunicar com o SofaScore.")
    except Exception as exc:
        log.exception("Erro inesperado ao buscar %s: %s", url, exc)
        raise HTTPException(status_code=500, detail="Erro interno inesperado no servidor.")

def safe_get(d: dict, *keys, default=None):
    """Acessa chaves aninhadas em dicionário de forma segura, sem KeyError."""
    cur = d
    for k in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(k, default)
        if cur is None:
            return default
    return cur
