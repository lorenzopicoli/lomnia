FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY backend/package.json ./backend/
COPY backend/knexfile.ts ./backend/

RUN pnpm install --frozen-lockfile --filter @lomnia/backend

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/ ./backend/

RUN pnpm --filter @lomnia/backend build

RUN pnpm --filter @lomnia/backend deploy --legacy --prod /app/deploy

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

RUN npm install -g pm2

COPY --from=builder /app/deploy/node_modules ./node_modules
COPY --from=builder /app/backend/build ./build
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/knexfile.ts ./
COPY --from=builder /app/backend/ecosystem.config.js ./

RUN mkdir -p logs && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3010
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
