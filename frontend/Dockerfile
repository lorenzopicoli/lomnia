FROM node:25-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

FROM base AS builder
WORKDIR /app
COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]