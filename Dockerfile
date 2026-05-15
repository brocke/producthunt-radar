# Multi-stage build for ProductHunt Radar.
# Pattern aligns with /root/news-app on the same VPS.
#
# Stage 1: install deps (incl. build tools for better-sqlite3 native binding).
# Stage 2: produce the Next.js standalone bundle.
# Stage 3: minimal runtime image — copies only the standalone output + needed
#          assets, runs as a non-root user.

# ---------- Stage 1: dependencies ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# Build toolchain for better-sqlite3's native module compilation.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci


# ---------- Stage 2: build ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ---------- Stage 3: runtime ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user for the running process.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone output + static assets + public.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrations need to be available at runtime (auto-migrate in lib/db.ts).
COPY --from=builder --chown=nextjs:nodejs /app/db/migrations ./db/migrations

# Directory where the SQLite volume will be mounted at runtime.
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
