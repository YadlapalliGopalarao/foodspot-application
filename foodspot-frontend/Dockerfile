
# Stage 1: Build Vue.js application
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Generate production files
RUN npm run build

# Stage 2: Non-root Nginx server
FROM nginx/nginx-unprivileged:stable-alpine

# Temporarily use root to patch OS packages
USER root

# Fix libxml2 security vulnerability
RUN apk add --no-cache --upgrade 'libxml2>=2.13.9-r3'

# Return to non-root user
USER 101

# Copy compiled Vue.js application
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Copy Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
