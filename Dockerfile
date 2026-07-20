FROM node:22-bookworm-slim AS dependencies
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/mairket/package.json ./apps/mairket/package.json
RUN npm ci

FROM dependencies AS builder
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV ARKET_DB_PATH=/app/apps/mairket/.data/arket.sqlite
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/mairket/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/mairket/.next/static ./apps/mairket/.next/static
RUN mkdir -p /app/apps/mairket/.data && chown -R nextjs:nodejs /app/apps/mairket/.data
USER nextjs
EXPOSE 3000
VOLUME ["/app/apps/mairket/.data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/mairket/server.js"]
