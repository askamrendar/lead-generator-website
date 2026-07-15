# Production image for Lead Generator Website (Phase 10.4).
# Multi-stage: install deps → build → slim runtime. Uses `next build` + `next start`
# (no next.config change required). For a smaller image later, set
# `output: 'standalone'` in next.config.mjs and switch the runner to the standalone
# server — that config change must go through the quality gates first.

# ---- deps ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Prisma needs openssl at install/generate time.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
# --ignore-scripts: package.json has a `postinstall: prisma generate` hook, but this
# stage has no prisma/ schema yet — the build stage runs `npx prisma generate` explicitly.
RUN npm ci --ignore-scripts

# ---- build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time. Platforms like
# Railway inject service variables as build args — declare it so the real public origin
# gets baked in (canonical URLs / sitemap / OG all derive from it). Falls back to the
# localhost demo build when unset (ALLOW_LOCALHOST_BUILD below acknowledges that).
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# Generate the Prisma client, then build. ALLOW_LOCALHOST_BUILD lets the image build
# without a public NEXT_PUBLIC_SITE_URL baked in; set it for real at runtime.
ENV NEXT_TELEMETRY_DISABLED=1
ENV ALLOW_LOCALHOST_BUILD=1
RUN npx prisma generate
RUN npm run build
# The repo ships no public/ dir (Next doesn't require one) — ensure it exists so the
# runner stage's COPY doesn't fail.
RUN mkdir -p public

# ---- runtime ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Non-root runtime user.
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

# Media store (local-fs provider) — pre-create with runtime-user ownership so uploads
# work as non-root. Mount a persistent volume here (e.g. Railway volume → /app/.media-store)
# or media is lost on redeploy.
RUN mkdir -p /app/.media-store && chown nextjs:nodejs /app/.media-store

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Apply migrations at boot, then start. (Remove the migrate step if you run
# migrations as a separate release job.)
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
