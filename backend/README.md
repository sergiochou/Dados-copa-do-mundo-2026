# 🏆 Copa do Mundo 2026 — Backend API

Servidor intermediário (proxy/scraper) que extrai dados da API interna do SofaScore e os serve formatados para o dashboard Front-end, contornando limitações de CORS.

---

## ⚡ Início Rápido

### 1. Pré-requisitos
- Python 3.10 ou superior
- pip

### 2. Instalar dependências
```bash
cd backend
pip install -r requirements.txt
```

### 3. Iniciar o servidor
```bash
uvicorn main:app --reload --port 8000
```

O servidor estará disponível em:
- **API:** `http://localhost:8000`
- **Documentação interativa (Swagger):** `http://localhost:8000/docs`
- **Documentação alternativa (ReDoc):** `http://localhost:8000/redoc`

---

## 📡 Endpoints Disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`  | `/api/jogos` | Lista todos os jogos da Copa 2026 |
| `GET`  | `/api/estatisticas/{partida_id}` | Estatísticas detalhadas de uma partida |
| `GET`  | `/api/artilheiros` | Top 10 artilheiros do torneio |
| `GET`  | `/api/grupos` | Classificação de todos os grupos |
| `GET`  | `/api/cache/status` | Status do cache em memória |
| `DELETE` | `/api/cache/limpar` | Limpa o cache forçando novas buscas |

---

## 🗄️ Sistema de Cache

O backend utiliza cache em memória com TTL de **5 minutos** via `cachetools`. Isso significa:

- 100 requisições simultâneas do Front-end → **apenas 1 requisição real** para o SofaScore
- Após 5 minutos, o cache expira automaticamente e os dados são atualizados na próxima chamada
- Use `DELETE /api/cache/limpar` para forçar atualização imediata

---

## 🔌 Integração com o Front-end

Substitua as chamadas à API-Sports no `api.js` para apontar para o backend local:

```javascript
const BACKEND_URL = "http://localhost:8000";

// Exemplo de uso
const response = await fetch(`${BACKEND_URL}/api/jogos`);
const jogos = await response.json();
```

---

## 🛡️ Anti-Bloqueio

O servidor simula cabeçalhos de navegador real em todas as requisições ao SofaScore:
- `User-Agent` do Chrome 125
- Headers `Referer` e `Origin` apontando para `sofascore.com`
- Headers `Sec-Fetch-*` para simular chamadas CORS legítimas

---

## 📁 Estrutura

```
backend/
├── main.py           # Aplicação FastAPI principal
├── requirements.txt  # Dependências Python
└── README.md         # Esta documentação
```
