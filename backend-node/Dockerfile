# QuickGift NestJS backend — container image for AWS App Runner / ECS Fargate.
# Multi-stage: build with full deps, then ship a lean prod image.

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Drop dev dependencies so only runtime deps are copied forward.
RUN npm prune --omit=dev

# ---- run stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# App Runner/ECS inject env vars (DATABASE_URL, keys, PORT) at runtime.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
EXPOSE 8001
CMD ["node", "dist/main.js"]
