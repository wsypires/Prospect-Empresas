# Guia de Deploy na Cloudflare (Cloudflare Pages)

Esta aplicação está 100% auditada e pronta para deploy no **Cloudflare Pages** com suporte completo a rotas estáticas (Vite SPA) e rotas de backend Serverless Edge via **Cloudflare Pages Functions** (`/functions`).

---

## 🚀 Método 1: Deploy pelo Painel da Cloudflare (Recomendado via Git / GitHub)

1. Acesse o [Painel da Cloudflare](https://dash.cloudflare.com/) e vá em **Compute (Workers) > Workers & Pages**.
2. Clique em **Create Application** > Aba **Pages** > **Connect to Git**.
3. Selecione o repositório do seu projeto.
4. Defina as seguintes configurações de compilação (**Build settings**):
   - **Framework preset**: `Vite` (ou `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (deixe vazio)
5. Em **Environment variables (Variáveis de ambiente)**, adicione:
   - `GOOGLE_MAPS_API_KEY`: A sua chave da API do Google Places / Maps.
   - `NODE_VERSION`: `20`
6. Clique em **Save and Deploy**.

---

## ⚡ Método 2: Deploy via CLI (Wrangler)

Se preferir fazer deploy direto do terminal usando o arquivo `wrangler.toml` já configurado:

1. Faça o build do projeto:
   ```bash
   npm run build
   ```

2. Realize o deploy no Cloudflare Pages:
   ```bash
   npx wrangler pages deploy dist --project-name encontre-empresas
   ```

3. Configure a sua chave de API nos secrets do projeto:
   ```bash
   npx wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name encontre-empresas
   ```

---

## 📋 Arquivos e Estrutura Criados na Auditoria

- `/functions/api/[[catchall]].ts`: Roteador universal do Cloudflare Pages Functions que redireciona todas as chamadas `/api/*` diretamente para o `apiCore.ts` executando no Edge (V8 Isolate).
- `/public/_routes.json`: Instrui a CDN da Cloudflare a servir todos os arquivos estáticos (`/assets/*`, imagens, CSS, JS) via cache global com zero custo de invocação e executar Functions apenas em `/api/*`.
- `/public/_headers`: Aplica cabeçalhos de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy` para geolocalização) e cache imutável de 1 ano para bundles gerados pelo Vite.
- `/wrangler.toml`: Configuração oficial com compatibilidade Node.js Edge (`compatibility_flags = ["nodejs_compat"]`).
- `src/server/apiCore.ts`: Núcleo de API Web-Standard (`Request`/`Response`/`fetch`) sem dependência de módulos de SO nativos do Node, rodando 100% no Edge runtime da Cloudflare.
