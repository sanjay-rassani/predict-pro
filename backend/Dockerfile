# Predict Pro — Backend image
# Auto-runs migrations + seed on start (see src/index.js)
FROM node:20-alpine

WORKDIR /app

# Install production dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source (respects .dockerignore)
COPY . .

ENV NODE_ENV=production
EXPOSE 3001

# Basic container healthcheck against the /health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
