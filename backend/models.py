from typing import List, Optional
from pydantic import BaseModel

class TimeInfo(BaseModel):
    id: Optional[int]
    nome: Optional[str]
    sigla: Optional[str]

class JogoSimples(BaseModel):
    id: Optional[int]
    rodada: Optional[str]
    data: Optional[str]
    status: Optional[str]
    mandante: TimeInfo
    visitante: TimeInfo
    placar_mandante: Optional[int]
    placar_visitante: Optional[int]

class RespostaJogos(BaseModel):
    total: int
    fonte_cache: bool
    jogos: List[JogoSimples]
