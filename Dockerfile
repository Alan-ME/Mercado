# Imagen del Backend Core + Frontend White-Label (ruta Postgres + Redis).
FROM node:20-alpine

WORKDIR /app

# Manifiestos primero para aprovechar el cacheo de capas de Docker
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/
COPY e2e/package.json e2e/

RUN npm ci

COPY . .
RUN npm run build

ENV PORT=8080
EXPOSE 8080
CMD ["node", "apps/backend/dist/server.js"]
