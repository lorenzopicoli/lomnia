FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN pnpm --filter @lomnia/frontend build

FROM nginx:alpine AS runner

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
