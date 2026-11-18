# Multi-stage production Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# Étape 1 : Dépendances
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml prisma ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

# Étape 2 : Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN pnpm run build

# Étape 3 : Exécution en production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["npx", "next", "start"]
