# Multi-stage build for Astro frontend
FROM oven/bun:1.2.21-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN bun install --production

FROM base AS build
WORKDIR /app
COPY . .
RUN bun run build

FROM nginx:1.25-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]