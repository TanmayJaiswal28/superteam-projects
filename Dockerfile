FROM node:22-bookworm-slim AS dependencies
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/arket/package.json ./apps/arket/package.json
RUN npm ci

FROM dependencies AS builder
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV ARKET_DB_PATH=/app/apps/arket/.data/arket.sqlite
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/arket/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/arket/.next/static ./apps/arket/.next/static
RUN mkdir -p /app/apps/arket/.data && chown -R nextjs:nodejs /app/apps/arket/.data
USER nextjs
EXPOSE 3000
VOLUME ["/app/apps/arket/.data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/arket/server.js"]
