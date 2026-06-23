# Como Hospedar o Dashboard Online Grátis 🚀

Este guia explica, passo a passo, como colocar seu projeto da Copa do Mundo 2026 no ar para que qualquer pessoa possa acessá-lo na internet de graça.

Graças às alterações que fizemos, o **FastAPI (Backend) agora serve os arquivos do Frontend de forma integrada**. Isso significa que você só precisa fazer **um único deploy** para ter a aplicação inteira no ar!

---

## Pré-requisito: Enviar o código para o GitHub

Tanto a Render quanto as outras plataformas usam o GitHub para puxar seu código e colocá-lo no ar automaticamente toda vez que você fizer uma alteração.

1. Crie uma conta gratuita em [github.com](https://github.com/) (caso não tenha).
2. Crie um repositório chamado `dados-copa-2026` como **Público**.
3. Envie seus arquivos locais para esse repositório do GitHub. Os comandos básicos de terminal para fazer isso a partir da pasta raiz (`Dados copa`) são:
   ```bash
   git init
   git add .
   git commit -m "commit inicial do dashboard"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/dados-copa-2026.git
   git push -u origin main
   ```

---

## Opção 1: Hospedar na Render (Recomendado & Mais Fácil)

A [Render](https://render.com/) é excelente para hospedar aplicações Python de graça.

### Passo a Passo:

1. Acesse [render.com](https://render.com/) e crie uma conta gratuita (pode entrar usando sua conta do GitHub).
2. No painel inicial da Render, clique no botão **New +** (no topo direito) e selecione **Web Service**.
3. Escolha **Build and deploy from a Git repository** e avance.
4. Conecte sua conta do GitHub e selecione o repositório `dados-copa-2026`.
5. Preencha as configurações do serviço:
   * **Name**: `dados-copa-2026` (ou o nome que preferir)
   * **Region**: Escolha a mais próxima (ex: *Ohio* ou *Frankfurt*)
   * **Branch**: `main`
   * **Root Directory**: Deixe em branco (para rodar a partir da pasta raiz)
   * **Runtime**: `Python`
   * **Build Command**: `pip install -r backend/requirements.txt`
   * **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Escolha o plano **Free** ($0/month).
7. Clique em **Create Web Service** no final da página.

*Pronto!* A Render vai começar a baixar e rodar seu código. Em cerca de 2 a 3 minutos, ela fornecerá um link gratuito (como `https://dados-copa-2026.onrender.com`).
Ao acessar este link, a página carregará a interface completa e se comunicará perfeitamente com a API.

> **Comportamento do Plano Gratuito da Render**:  
> Se o site não receber visitas por 15 minutos, o servidor entra em modo de suspensão (*sleep*). Quando alguém acessar o site novamente, ele levará cerca de 50 segundos para "acordar" no primeiro carregamento. Depois disso, navega super rápido.

---

## Opção 2: Hospedar no Hugging Face Spaces (Sem "Modo de Espera")

Se você quer que o site fique **satisfeito e 100% online sem entrar em suspensão** (sem os 50 segundos de espera após inatividade), o [Hugging Face Spaces](https://huggingface.co/spaces) é uma excelente alternativa gratuita que roda via Docker.

### Passo a Passo:

1. Crie uma conta gratuita em [huggingface.co](https://huggingface.co/).
2. No topo direito, clique na sua foto e vá em **New Space**.
3. Configure o Space:
   * **Space Name**: `copa-2026-dashboard`
   * **License**: `mit` (ou qualquer outra)
   * **SDK**: Escolha a opção **Docker**.
   * **Docker template**: Escolha **Blank**.
   * **Space Hardware**: Escolha **CPU basic · 16 GB · Free** (é a padrão grátis).
   * **Visibility**: `Public`.
4. Clique em **Create Space**.
5. Crie um arquivo chamado `Dockerfile` na raiz do seu projeto local com o seguinte conteúdo:
   ```dockerfile
   FROM python:3.10-slim
   WORKDIR /app
   COPY . .
   RUN pip install --no-cache-dir -r backend/requirements.txt
   EXPOSE 7860
   ENV PORT=7860
   CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
   ```
6. Crie uma variável secreta no Hugging Face:
   * Vá em **Settings** do seu Space -> aba **Variables and secrets**.
   * Em *Repository secrets*, adicione uma nova variável:
     * **Name**: `SCRAPER_API_KEY`
     * **Value**: `a331e13108735032ca55c4859a12472d`
7. Suba todo o código (incluindo o novo `Dockerfile`) para o Space. Você pode clonar o repositório git que o Hugging Face fornece e arrastar seus arquivos, ou usar o Git normal.
8. O Hugging Face irá compilar a imagem Docker e colocar o site no ar. O site ficará disponível em um link do tipo `https://huggingface.co/spaces/SEU_USUARIO/copa-2026-dashboard` permanente e sem tempo de inatividade (*spin down*)!

---

## Opção 3: Frontend na Vercel (Ultra Rápido) + Backend na Render

Se você quer o carregamento inicial da página com velocidade máxima, pode separar o frontend estático e o backend dinâmico:

1. **Frontend**: Hospede na [Vercel](https://vercel.com/) ou [Netlify](https://www.netlify.com/) de graça. Basta conectar o GitHub e selecionar o repositório. Como são apenas arquivos HTML/CSS/JS estáticos, o deploy é instantâneo e extremamente rápido em servidores de borda.
2. **Backend**: Hospede na Render seguindo a **Opção 1**.
3. **Ajuste**: Nesse caso, no arquivo `api.js` local, você deve alterar a URL de `API_BASE` para apontar diretamente para a sua URL gerada na Render (ex: `https://dados-copa-2026.onrender.com/api`).
