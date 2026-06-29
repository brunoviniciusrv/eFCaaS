# ─── Build ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG GEMINI_API_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# ─── Runtime (arquivos estáticos) ────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve@14.2.4

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production

# Railway injeta PORT e VITE_API_URL em runtime (config.js evita rebuild só por mudar a URL)
CMD ["sh", "-c", "node -e \"const fs=require('fs');const u=process.env.VITE_API_URL||'';if(u&&fs.existsSync('dist/runtime-config.js')){fs.writeFileSync('dist/runtime-config.js','window.__EFCAAS_CONFIG__={apiUrl:'+JSON.stringify(u)+'};');}\" && serve -s dist -l ${PORT:-3000}"]
