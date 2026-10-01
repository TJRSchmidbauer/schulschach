FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json ./
RUN npm install

FROM deps AS builder
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S -g 10001 schulschach && adduser -S -D -H -u 10001 -G schulschach schulschach
COPY --from=builder --chown=schulschach:schulschach /app ./
USER schulschach
EXPOSE 3000
CMD ["sh", "docker/entrypoint.sh"]
