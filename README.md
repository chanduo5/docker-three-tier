# 🐳 Three-Tier Dockerised Application

A fully containerised three-tier web application using **Nginx → Node.js/Express → MySQL 8.0**, orchestrated with Docker Compose.

---

## 1. Setup Instructions

### Prerequisites
- Docker ≥ 24.x  
- Docker Compose plugin ≥ 2.x  
- Git

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd docker-three-tier

# 2. Create your local .env from the example
cp .env.example .env
# (Optionally edit .env to change passwords)

# 3. Build images and start all services
docker compose up --build

# 4. Open your browser
#    http://localhost:80
```

To run in detached (background) mode:
```bash
docker compose up --build -d
```

To stop everything:
```bash
docker compose down
```

To stop AND delete the database volume (full reset):
```bash
docker compose down -v
```

---

## 2. Architecture Diagram

```
Browser
   │
   │  HTTP :80
   ▼
┌──────────────────────────────┐
│   frontend (nginx:alpine)    │  Container: frontend_nginx
│                              │  Serves static index.html
│   GET /         → index.html │
│   GET /api/*    → proxy ─────┼────────────────────────┐
└──────────────────────────────┘                        │
         (app_network / bridge)                         │ http://backend:3000
                                                        ▼
                                        ┌───────────────────────────┐
                                        │  backend (node:alpine)    │  Container: backend_api
                                        │                           │
                                        │  GET /         → JSON OK  │
                                        │  GET /health   → DB ping  │
                                        └───────────────┬───────────┘
                                                        │ mysql://mysql:3306
                                                        ▼
                                        ┌───────────────────────────┐
                                        │   mysql (mysql:8.0)       │  Container: mysql_db
                                        │                           │
                                        │  Named Volume: mysql_data │
                                        └───────────────────────────┘

All three containers share: app_network (custom bridge)
```

---

## 3. Explanation of Strict Requirements

### ✅ How does the backend wait for MySQL?

`docker-compose.yml` uses `depends_on` with `condition: service_healthy`:

```yaml
depends_on:
  mysql:
    condition: service_healthy
```

Docker Compose will **not start the backend container** until the `mysql` service passes its health check (`mysqladmin ping`). This is evaluated every 10 seconds with a 30-second start period. Simply using `depends_on: mysql` (without a condition) does NOT wait for MySQL to be ready — it only waits for the container to start, not for MySQL to accept connections.

### ✅ How does Nginx dynamically get the backend URL?

The Nginx config is stored as a **template** (`nginx.conf.template`) with a placeholder `${BACKEND_URL}` instead of a hardcoded IP or hostname. At container startup, the `CMD` runs:

```sh
envsubst '${BACKEND_URL}' < nginx.conf.template > /etc/nginx/conf.d/default.conf
```

`envsubst` replaces `${BACKEND_URL}` with the value of the environment variable injected by Docker Compose (`http://backend:3000`). This means you can change the backend address just by changing the environment variable — no image rebuild needed.

### ✅ How do the containers communicate?

All three services are attached to a custom bridge network called `app_network`. On a Docker bridge network, each container is reachable by its **service name** as a DNS hostname. So:

- Nginx reaches the backend at `http://backend:3000`
- The backend reaches MySQL at `mysql:3306`

No IP addresses are ever hardcoded.

---

## 4. Testing Steps

### View the frontend in a browser
Open: [http://localhost:80](http://localhost:80)

You will see a status dashboard. Click **Refresh Status** to see live results.

### Hit the backend API directly through Nginx
```bash
# Root route – should return JSON with "Backend is running"
curl http://localhost:80/api/

# Health route – should return DB status
curl http://localhost:80/api/health
```

Expected `/api/health` response when everything is up:
```json
{
  "status": "healthy",
  "service": "backend",
  "database": "connected",
  "db_message": "MySQL ping successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Check container health statuses
```bash
docker compose ps
```

All three services should show `(healthy)` in the STATUS column.

### Stream live logs from all services
```bash
docker compose logs -f
```

---

## 5. Failure Scenario – MySQL Restart Chaos Test

### What to do
While the app is fully running, restart the MySQL container:

```bash
docker restart mysql_db
```

### What happens — step by step

| Time | What happens |
|------|--------------|
| 0s   | `docker restart mysql_db` is executed. MySQL begins its shutdown sequence. |
| ~1s  | MySQL container stops. The backend's connection pool loses all open connections. |
| ~2s  | The backend receives connection errors (`ECONNREFUSED` or `PROTOCOL_CONNECTION_LOST`). Any in-flight `/api/health` calls return `503 unhealthy`. |
| ~5s  | MySQL container restarts and begins initialising. |
| ~15-25s | MySQL finishes startup and begins accepting connections. |
| ~30s | `mysql2/promise` connection pool automatically reconnects on the next query attempt (`enableKeepAlive: true`). |
| ~35s | `GET /api/health` returns `200 healthy` again. |

### How to observe it live
```bash
# Terminal 1 – watch logs in real time
docker compose logs -f

# Terminal 2 – poll the health endpoint every 2 seconds
watch -n 2 curl -s http://localhost:80/api/health

# Terminal 3 – restart MySQL
docker restart mysql_db
```

### Recovery mechanism
The `mysql2/promise` pool has `waitForConnections: true` and `enableKeepAlive: true`. When the pool detects a broken connection, it removes it and re-establishes a fresh connection on the next request. **No backend restart is required.** Recovery typically takes 20–35 seconds depending on the machine's speed.
