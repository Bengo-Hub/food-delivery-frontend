# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js bakes NEXT_PUBLIC_* at build time. Pass these in CI/deploy to avoid production calling localhost.
ARG NEXT_PUBLIC_API_URL=https://orderingapi.codevertexitsolutions.com/api/v1
ARG NEXT_PUBLIC_SSO_URL=https://sso.codevertexitsolutions.com
ARG NEXT_PUBLIC_CAFE_WEBSITE_URL=https://theurbanloftcafe.com
ARG NEXT_PUBLIC_LOGISTICS_UI_URL=https://logistics.codevertexitsolutions.com
ARG NEXT_PUBLIC_NOTIFICATIONS_API_URL=https://notificationsapi.codevertexitsolutions.com
ARG NEXT_PUBLIC_TREASURY_API_URL=https://treasuryapi.codevertexitsolutions.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SSO_URL=$NEXT_PUBLIC_SSO_URL
ENV NEXT_PUBLIC_CAFE_WEBSITE_URL=$NEXT_PUBLIC_CAFE_WEBSITE_URL
ENV NEXT_PUBLIC_LOGISTICS_UI_URL=$NEXT_PUBLIC_LOGISTICS_UI_URL
ENV NEXT_PUBLIC_NOTIFICATIONS_API_URL=$NEXT_PUBLIC_NOTIFICATIONS_API_URL
ENV NEXT_PUBLIC_TREASURY_API_URL=$NEXT_PUBLIC_TREASURY_API_URL

RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user for security (matches auth-ui pattern)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
