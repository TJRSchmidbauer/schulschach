FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

FROM deps AS builder
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S -g 10001 schulschach && adduser -S -D -H -u 10001 -G schulschach schulschach
COPY --from=builder --chown=schulschach:schulschach /app/public ./public
COPY --from=builder --chown=schulschach:schulschach /app/.next/standalone ./
COPY --from=builder --chown=schulschach:schulschach /app/.next/static ./.next/static
COPY --from=builder --chown=schulschach:schulschach /app/prisma ./prisma

USER schulschach
EXPOSE 3000
CMD ["node", "server.js"]
