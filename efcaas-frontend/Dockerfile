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

# Railway injeta PORT em runtime
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
