# Multi-stage Dockerfile for UPSSA Club Portal (Fullstack Angular 19 + Express + SQLite Node 22)

# --- Stage 1: Build Angular Frontend ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN npm ci --omit=dev --prefix backend

# Copy backend source code
COPY backend/ ./backend/

# Copy compiled frontend build
COPY --from=frontend-builder /app/frontend/dist/frontend/browser ./frontend/dist/frontend/browser

# Ensure uploads directory exists
RUN mkdir -p /app/backend/uploads

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "server.js"]

