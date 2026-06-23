"""
╔══════════════════════════════════════════════════════════════╗
║   Copa do Mundo 2026 · Backend API (Proxy/Scraper SofaScore) ║
║   Tecnologia: Python 3.10+ | FastAPI | httpx | cachetools    ║
╠══════════════════════════════════════════════════════════════╣
║  Como rodar:                                                 ║
║    1. pip install -r requirements.txt                        ║
║    2. uvicorn main:app --reload --port 8000                  ║
║  A API estará disponível em: http://localhost:8000           ║
║  Documentação automática: http://localhost:8000/docs         ║
╚══════════════════════════════════════════════════════════════╝
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from scraper import get_http_client, _http_client
from routers import jogos, estatisticas, artilheiros, grupos, cache_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

app = FastAPI(
    title="Copa do Mundo 2026 · API",
    description=(
        "Proxy/Scraper sobre a API interna do SofaScore. "
        "Serve dados limpos e formatados para o dashboard Front-end."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "DELETE"],
    allow_headers=["*"],
)

app.include_router(jogos.router)
app.include_router(estatisticas.router)
app.include_router(artilheiros.router)
app.include_router(grupos.router)
app.include_router(cache_router.router)



@app.on_event("startup")
async def startup_event():
    await get_http_client()
    log.info("Servidor iniciado. Conexões abertas.")

@app.on_event("shutdown")
async def shutdown_event():
    import scraper
    if scraper._http_client and not scraper._http_client.is_closed:
        await scraper._http_client.aclose()
# Servir arquivos estáticos do frontend em deploy integrado
static_dir = "../" if os.path.exists("../index.html") else "./"
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
