FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY packages/server/package*.json ./

# Install dependencies (use install instead of ci since we don't have package-lock)
RUN npm install --omit=dev

# Copy built server code
COPY packages/server/dist ./dist
COPY packages/server/.env.example ./.env.example

# Expose port (Express server uses 3001, not 7071 which is Azure Functions)
EXPOSE 3001

# Health check (note: health endpoint is at /api/health)
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start server
CMD ["node", "dist/index.js"]
