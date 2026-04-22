# syntax=docker/dockerfile:1.7
# ---- Stage 1: build ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ---- Stage 2: runtime (nginx) ----
FROM nginx:1.27-alpine AS runtime

# Install bash for envsubst wrapper (alpine uses busybox sh by default)
RUN apk add --no-cache gettext

# nginx config — SPA fallback + API proxy read from $API_URL at startup.
COPY <<'NGINX' /etc/nginx/conf.d/default.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|svg|woff2?|ttf|png|jpg|jpeg|gif|ico)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
  }
}
NGINX

COPY --from=builder /app/dist /usr/share/nginx/html

# Entrypoint: on boot, write runtime-config.js with the API_URL env var.
COPY <<'SH' /docker-entrypoint.d/50-write-runtime-config.sh
#!/bin/sh
set -eu
API_URL="${API_URL:-http://127.0.0.1:9119}"
cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__HERMES_RUNTIME_CONFIG__ = { API_URL: "${API_URL}" };
EOF
SH
RUN chmod +x /docker-entrypoint.d/50-write-runtime-config.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
