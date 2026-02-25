# Single-stage: nginx:alpine + node.js + git
# entrypoint.sh does git pull + conditional rebuild on every container start
FROM nginx:alpine

# Add node.js, npm, and git
RUN apk add --no-cache nodejs npm git

WORKDIR /app

# Copy source files (including .git so git pull works at runtime)
COPY . .

# Pre-install dependencies so the image layer is cached
# (entrypoint re-runs npm ci only when code changes)
RUN npm ci

# nginx configuration (same path as the official nginx:alpine image)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
