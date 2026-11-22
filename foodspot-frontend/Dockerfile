
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

# Remove default static content
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled Vue.js application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Run Nginx without root privileges
USER 101

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
