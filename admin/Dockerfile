# Predict Pro — Admin (Next.js) image
FROM node:20-alpine

WORKDIR /app

# Install all dependencies (build needs devDependencies)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source (respects .dockerignore)
COPY . .

# NEXT_PUBLIC_* vars are inlined at build time. The browser runs on the
# client machine, so it reaches the backend at localhost:3001 by default.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

ENV NODE_ENV=production
# Next.js listens on 0.0.0.0 so the port is reachable from the host
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
