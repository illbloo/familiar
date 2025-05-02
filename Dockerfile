FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
WORKDIR /app
COPY --link package.json bun.lock ./
COPY --link client/package.json client/package.json
COPY --link mcp/bridge/package.json mcp/bridge/package.json
COPY --link mcp/server/package.json mcp/server/package.json
COPY --link memory/package.json memory/package.json
COPY --link midi/package.json midi/package.json
COPY --link notebook/package.json notebook/package.json
COPY --link sampler/package.json sampler/package.json
COPY --link tools/search/package.json tools/search/package.json
COPY --link tools/uithub/package.json tools/uithub/package.json
RUN bun install --frozen-lockfile

FROM install AS mcp-bridge
WORKDIR /app
COPY --link ./mcp.json ./
WORKDIR /app/mcp/bridge
COPY --link mcp/bridge ./
CMD ["bun", "index.ts"]

FROM install AS memory-builder
WORKDIR /app/memory
COPY --link memory/src ./src
COPY --link memory/drizzle ./drizzle
COPY --link memory/tsconfig.json memory/drizzle.config.ts ./
RUN bun run drizzle-kit generate \
    && bun build src/index.ts --compile --outfile server

FROM debian:bookworm-slim AS memory
WORKDIR /app
COPY --from=memory-builder /app/memory/server ./server
CMD ["./server"]
