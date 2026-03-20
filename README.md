
# *DevOps Internship Challenge*

## 🚀 Dockerized 3-Tier Application Architecture

![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Alpine Linux](https://img.shields.io/badge/Alpine_Linux-%230D597F.svg?style=for-the-badge&logo=alpine-linux&logoColor=white)

**A highly resilient, production-ready 3-tier web application containerized using Docker.**
*This project demonstrates advanced container orchestration, dynamic reverse proxy configuration, strict startup dependency management, and secure multi-stage builds.* 

---

---

## 🌐 Project Overview

This infrastructure is built using three distinct tiers:

**Frontend (Nginx):** Serves a static HTML dashboard and acts as a reverse proxy, forwarding API requests to the backend. Built on `nginx:alpine`.

**Backend (API):** A lightweight API service handling business logic and database health checks. Built on `node:alpine`.

**Database (MySQL):** Persistent storage using the official `mysql:8.0` image with a named Docker volume to prevent data loss.

---

## 🏗️ Architecture Diagram

*The entire stack is isolated within a custom Docker bridge network, ensuring secure, service-name-based communication. The database is completely hidden from the public host network.*

> **Visual Architecture Flow:**


```text
+-------------------+       +-------------------+       +-------------------+
|   Web Browser     |       | Frontend (Nginx)  |       | Backend (API)     |
|   (Localhost:80)  | ----> | static HTML &     | ----> | REST API &        |
|                   |       | Reverse Proxy     |       | DB Health Check   |
+-------------------+       +-------------------+       +-------------------+
                                                              |
                                                              v
                                                    +-------------------+
                                                    | Database (MySQL)  |
                                                    | (Named Volume)    |
                                                    +-------------------+
```

---

## ⚙️ Prerequisites & Setup

## Get Your Project Files Ready
<img src="images/Screenshot 2026-03-21 022746.png" alt="My Image" width="500">
--------------------------------------------------------------------------

## connect with the container with ssh 
<img src="images/Screenshot 2026-03-21 015726.png" alt="My Image" width="500">


<img src="images/Screenshot 2026-03-21 015740.png" alt="My Image" width="500">

----------------------------------------------------------------------------------------

## Start docker services and install them also ...
<img src="images/Screenshot 2026-03-21 015805.png" alt="My Image" width="500">

---------------------------------------------------------------------------------------------

<img src="images/Screenshot 2026-03-21 015838.png" alt="My Image" width="500">


Ensure you have Docker and Docker Compose installed on your local machine before proceeding.

### Step 1: Clone and Configure Environment

. First, clone the repository and set up your secure environment variables.

------------------------------
<img src="images/Screenshot 2026-03-21 015910.png" alt="My Image" width="500">

------------------------------
```bash
# Clone the repo
git clone https://github.com/chanduo5/docker-three-tier

# Create the active .env file from the example template
cp .env.example .env
```
*(Note: Never commit your actual `.env` file to version control. Only `.env.example` is tracked.)*

### Step 2: Build and Launch

Deploy the entire stack using a single Docker Compose command.

```bash
docker compose up --build -d
```
> **Terminal Output:**
<img src="images/Screenshot 2026-03-21 015928.png" alt="My Image" width="500">


---

## 🧪 Testing the Application

*Once the containers are successfully running, you can verify the deployment through the browser and the command line.*

### 1. User Interface Verification

### Open your web browser and navigate to `http://localhost:80`. You will see the live frontend dashboard confirming the system status.

> **Frontend Dashboard:**
------------------------------------------------------
<img src="images/Screenshot 2026-03-21 022300.png" alt="My Image" width="500">

-----------------------------------------------------
### 2. API & Proxy Verification

Nginx dynamically routes traffic from `/api` directly to the backend container. Test this via your terminal:

<img src="images/Screenshot 2026-03-21 015941.png" alt="My Image" width="500">

```bash
# Verify the backend is reachable via the proxy
curl http://localhost:80/api/

# Verify the backend can successfully query the database
curl http://localhost:80/api/health
```

---



---

## ✅ STEP 4 — Verify It's Working

### Open the browser dashboard
```
http://localhost:80
```
You'll see a live status page with green dots for Backend ✅ and Database ✅.

### Test via terminal (curl)
```bash
# Test backend root through Nginx
curl http://localhost:80/api/

# Test database health through Nginx
curl http://localhost:80/api/health
```

Expected output for `/api/health`:
```json
{
  "status": "healthy",
  "service": "backend",
  "database": "connected",
  "db_message": "MySQL ping successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Check all containers are healthy
```bash
docker compose ps
```
<img src="images/Screenshot 2026-03-21 020657.png" alt="My Image" width="500">



All 3 should show **`(healthy)`** in the STATUS column.

### Watch live logs
```bash
docker compose logs -f
```
Press `Ctrl+C` to stop watching.

---

## 🔴 STEP 5 — Chaos Test (MySQL Restart)

Open **3 separate terminals**:

**Terminal 1** — watch logs:
```bash
docker compose logs -f
```

**Terminal 2** — poll health endpoint every 2 seconds:
```bash
# Mac/Linux
watch -n 2 curl -s http://localhost:80/api/health

# Windows (PowerShell)
while ($true) { curl http://localhost:80/api/health; Start-Sleep 2 }
```

**Terminal 3** — restart MySQL:
```bash
docker restart mysql_db
```

Watch Terminal 2 — the health check will show `503 unhealthy` for about 20–30 seconds, then automatically recover to `200 healthy` without you doing anything.

---

**Chaos Test Logs:**

<img src="images/Screenshot 2026-03-21 022255.png" alt="My Image" width="500">


## 🛑 How to Stop the App

```bash
# Stop but keep the database data
docker compose down

# Stop AND delete everything including database
docker compose down -v
```

---

# After this command the database will stoped and the application will stop working ......

<img src="images/Screenshot 2026-03-21 022906.png" alt="My Image" width="500">

-------------------------------------------


## 🛠️ Technical Implementations (Strict Requirements)

**This project strictly adheres to DevOps best practices to solve common containerization challenges.**

**Dynamic Nginx Configuration:** The backend URL is never hardcoded.Using an `nginx.conf.template`, the environment variable `$BACKEND_URL` is dynamically injected using `envsubst` during container initialization.

**Strict Startup Dependencies:** To prevent the "race condition" where the backend crashes before the database boots, `docker-compose.yml` utilizes strict `healthcheck` dependencies .The backend waits until MySQL returns a successful `mysqladmin ping` before starting.

**Security & Optimization:** Both custom Dockerfiles utilize Multi-Stage builds to keep image sizes extremely low and execute all application processes as a **non-root user** to mitigate security vulnerabilities.

---



## 🔥 Resilience & Chaos Testing (Failure Scenario)

To prove the system's fault tolerance, a deliberate failure was injected into the environment by forcefully restarting the database container.

**The Execution:**
```bash
docker restart <mysql-container-name>
```

**System Behavior & Recovery:**

1.  **Immediate State:** The Node.js backend immediately detected the dropped database connection.Instead of crashing the container, it gracefully degraded, returning a `503 Service Unavailable` for health checks.

2.  **Recovery Phase:** Nginx continued to serve the static frontend without interruption.

3.  **Resolution:** Once the MySQL container completed its boot sequence, the backend automatically re-established the database connection pool.

4.  **Recovery Time:** Full system health (`200 OK`) was restored in approximately **[Insert Your Time Here, e.g., 18 seconds]** without any manual intervention.

> 


---
**Author:** Chander Mohan Meena
```
As I continuously expand my technical skill set, this project was engineered utilizing
a blend of personal reference notes, community-driven YouTube tutorials, and AI tools
for optimization and problem-solving. A huge thank you to the creators and the wider
community for providing such invaluable learning materials.
```
# thank you 
