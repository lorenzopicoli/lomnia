FROM node:25-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --only=production && npm cache clean --force

FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY ecosystem.config.js ./

RUN npm ci

COPY . .

RUN npm run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

RUN npm install -g pm2

COPY --from=builder /app/build ./build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/ecosystem.config.js ./

RUN mkdir -p logs && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3010

CMD ["pm2-runtime", "start", "ecosystem.config.js"]