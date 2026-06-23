# 🏆 Dashboard Copa do Mundo FIFA 2026

Um painel analítico completo, moderno e interativo para acompanhar as seleções, classificação dos grupos e confrontos da Copa do Mundo FIFA 2026. A aplicação foi construída em duas partes: um **Front-end SPA** de altíssima fidelidade visual com estética *glassmorphism* e um **Backend API/Proxy** em Python para extrair, processar e cachear estatísticas em tempo real diretamente do SofaScore.

---

## 🎨 Principais Destaques e Funcionalidades

### 1. Visual Premium & Glassmorphism
* **Fundo Atmosférico**: Efeito desfocado (*bokeh*) de um campo de futebol à noite com um gradiente radial escuro que garante legibilidade e imersão.
* **Painéis translúcidos**: Cards e painéis flutuantes com fundo jateado (`backdrop-filter: blur`), bordas sutis e sombras elegantes.
* **Barras Neon (Light Trails)**: Barras de progresso com cantos arredondados que crescem do centro para fora, com brilho neon e um ponto de luz branca nas extremidades.
* **Paleta Harmoniosa**: Cores de contraste dinâmicas, com ciano vibrante para o time mandante e coral suave para o visitante.

### 2. Aba "Resumo" (Home)
* Destaque para o confronto principal do dia com placares amplos.
* Cards de resumo com estatísticas acumuladas do torneio (média de gols por jogo, cartões, etc.).
* Ranking de **Artilheiros** em tempo real com destaque medalhado (🥇, 🥈, 🥉).

### 3. Aba "Grupos" (Tabelas de Classificação)
* Tabela completa de todos os grupos da Copa de A a L.
* **Melhores Terceiros (Melhores 3º colocados)**: Regra de classificação especial que destaca em dourado os **8 melhores terceiros colocados** que avançam de fase.
* Visualização da forma recente (V, E, D) de cada seleção diretamente na tabela.

### 4. Aba "Jogos" (Detalhes e Raio-X H2H)
* **Jogos Realizados**: Exibição de estatísticas detalhadas de posse de bola, chutes totais, chutes no alvo, faltas, escanteios, impedimentos, cartões (amarelos e vermelhos), total de passes, laterais e precisão de passe.
* **Raio-X (Jogos Futuros)**: Comparativo frente a frente (Head-to-Head) exibindo o histórico de confrontos diretos e médias de desempenho com filtro de escopo:
  * **Só da Copa**: Médias registradas apenas durante o torneio.
  * **Ano 2026**: Estatísticas de todos os jogos disputados pela seleção no ano (eliminatórias e amistosos).
* **Divisor com Ícones Temáticos**: Um divisor central nítido com crachás de ícones específicos para cada estatística (ex: ⚽ para posse, 🥅 para gols, 🧤 para chutes sofridos, 👐 para laterais).

### 5. Aba "Seleções" (Perfil Individual)
* Grade de todas as seleções participantes.
* Detalhamento de pontos, classificação, próximos jogos e médias de jogo acumuladas (Gols, Chutes, Posse, Passes, Laterais, Impedimentos, Cartões) sob os filtros "Copa" ou "Ano 2026".

---

## 🛠️ Tecnologias Utilizadas

### Front-end
* **HTML5** & **Vanilla CSS3** (CSS Grid, Flexbox, Variáveis CSS, Efeitos de vidro/blur, Transições suaves).
* **Javascript (ES6+)** estruturado como SPA baseado em módulos de view dinâmicos.
* **Sistema de Cache**: Persistência de dados no `localStorage` por 24 horas para evitar requisições repetidas na API, com botão de sincronização manual.

### Back-end
* **Python 3.10+** com **FastAPI** para a criação dos endpoints REST.
* **Scraper SofaScore**: Integração robusta via **ScraperAPI** e **httpx** para bypassar restrições do Cloudflare de forma estável.
* **Cache em Memória**: Cache local temporário no backend (`cachetools`) para otimizar tempo de resposta e poupar requisições adicionais.
* **Deploy Integrado**: O backend FastAPI está configurado para servir diretamente os arquivos estáticos do frontend em produção.

---

## 🚀 Como Rodar Localmente

### 1. Clonar o projeto
Certifique-se de ter o repositório clonado localmente.

### 2. Rodar o Backend FastAPI
1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```
2. Crie e ative um ambiente virtual:
   ```bash
   python -m venv .venv
   # No Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   # No Linux/Mac:
   source .venv/bin/activate
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Inicie o servidor local:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *O backend estará rodando em `http://localhost:8000`.*

### 3. Rodar o Frontend
Você pode abrir o arquivo `index.html` diretamente no navegador ou rodar um servidor HTTP simples na pasta raiz para carregar os módulos ES6 de forma correta (evitando bloqueios de CORS locais):
```bash
python -m http.server 3000
```
*Acesse o dashboard em `http://localhost:3000`.*

---

## ☁️ Hospedagem Online (Grátis)

Para colocar o projeto no ar gratuitamente na **Render** ou no **Hugging Face Spaces**, consulte o guia detalhado e configurado em:
👉 **[COMO_HOSPEDAR.md](COMO_HOSPEDAR.md)**
