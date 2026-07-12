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
RUN npm ci

# ---- build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client, then build. ALLOW_LOCALHOST_BUILD lets the image build
# without a public NEXT_PUBLIC_SITE_URL baked in; set it for real at runtime.
ENV NEXT_TELEMETRY_DISABLED=1
ENV ALLOW_LOCALHOST_BUILD=1
RUN npx prisma generate
RUN npm run build

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

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Apply migrations at boot, then start. (Remove the migrate step if you run
# migrations as a separate release job.)
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
