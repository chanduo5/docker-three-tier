# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app
COPY package.json ./
# Install only production dependencies
RUN npm install --omit=dev

# ── Stage 2: final runtime image ─────────────────────────────────────────────
FROM node:18-alpine

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY app.js .
COPY package.json .

# Give ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

# Logs go to stdout/stderr automatically (no log files)
CMD ["node", "app.js"]