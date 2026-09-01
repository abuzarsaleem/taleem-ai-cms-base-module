# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json package-lock.json ./
COPY libs/common/package.json ./libs/common/
COPY libs/config/package.json ./libs/config/
COPY libs/database/package.json ./libs/database/
RUN npm ci

FROM deps AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY libs/common/package.json ./libs/common/
COPY libs/config/package.json ./libs/config/
COPY libs/database/package.json ./libs/database/
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/apps/base-api/main.js"]
