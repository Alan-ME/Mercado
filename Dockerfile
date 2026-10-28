# Imagen del Backend Core + Frontend White-Label (ruta "documentada": Postgres + Redis).
FROM node:20-alpine

WORKDIR /app

# Manifiestos primero (mejor cacheo de capas)
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/
COPY e2e/package.json e2e/

# Instala dependencias del monorepo + drivers reales (pg, ioredis) para el modo Docker.
RUN npm install && npm install --workspace @smcta/backend pg ioredis

# Código fuente y build
COPY . .
RUN npm run build:shared && npm run build --workspace @smcta/backend && npm run build:web

ENV PORT=8080
EXPOSE 8080
CMD ["node", "apps/backend/dist/server.js"]
