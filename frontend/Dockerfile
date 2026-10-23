# Frontend Dockerfile
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ ./

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN adduser -D -H -h /var/www -s /bin/bash www && \
    chown -R www:www /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

USER www

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5173/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]