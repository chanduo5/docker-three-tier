# ── Stage 1: builder (just copies static files) ──────────────────────────────
FROM nginx:alpine AS builder

WORKDIR /app
COPY index.html .

# ── Stage 2: final runtime image ─────────────────────────────────────────────
FROM nginx:alpine

# Install gettext so we have envsubst available
RUN apk add --no-cache gettext

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy the template config (NOT the final config — envsubst fills it at startup)
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Copy static HTML from builder stage
COPY --from=builder /app/index.html /usr/share/nginx/html/index.html

# Run as non-root: nginx needs pid file in writable location
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && chown -R nginx:nginx /var/cache/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

# At startup: run envsubst to inject BACKEND_URL into the template,
# write the result to conf.d/default.conf, then start nginx
CMD ["/bin/sh", "-c", \
     "envsubst '${BACKEND_URL}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]