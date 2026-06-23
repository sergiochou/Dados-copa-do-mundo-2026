FROM python:3.10-slim

WORKDIR /app

# Instala dependências do sistema necessárias se houver alguma
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copia requisitos e instala dependências
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copia todos os arquivos do projeto
COPY . .

# Expõe a porta padrão (Hugging Face Spaces usa 7860, Render usa a variável $PORT)
EXPOSE 7860
ENV PORT=7860

# Comando para rodar o servidor FastAPI (usa a variável $PORT do ambiente)
CMD uvicorn backend.main:app --host 0.0.0.0 --port $PORT
