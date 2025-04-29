FROM node:alpine

WORKDIR /app

RUN apk add --no-cache pnpm
COPY --link package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --link ./src ./src
COPY --link ./drizzle ./drizzle
COPY --link tsconfig.json drizzle.config.ts ./

RUN pnpm drizzle-kit generate \
    && pnpm build

CMD ["pnpm", "start"]