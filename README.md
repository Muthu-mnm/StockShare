# StockShare — B2B Excess-Inventory Exchange Platform

StockShare is a production-ready, full-stack B2B platform that enables businesses to list surplus inventory and exchange unused stock with other organizations. The project includes a React 19 single-page frontend, an Express.js backend with SQLite persistence, Docker Compose orchestration, Prometheus metrics collection, Grafana telemetry dashboards, and Jenkins CI/CD automation.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────────────┐
                      │              Browser (Client)                  │
                      └──────────────┬──────────────────┬──────────────┘
                                     │                  │
                Port 8081 (Docker)   │                  │ Port 5173 (Vite Dev)
                                     ▼                  ▼
┌──────────────────────────────────────────────┐  ┌────────────────────────────────┐
│   frontend (Nginx Container)                 │  │   Vite Dev Server              │
│   • Serves React 19 SPA (try_files fallback) │  │   • Port 5173                  │
│   • Reverse proxies /api/ -> backend:5000    │  │   • Proxies /api/ -> :5000     │
└──────────────────────┬───────────────────────┘  └───────────────┬────────────────┘
                       │                                          │
                       └───────────────────┬──────────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│   backend (Node.js 24 + Express Container / Process)                             │
│   • REST Endpoints: /api/inventory, /api/requests, /api/dashboard/summary        │
│   • Health Checks:  GET /health (HTTP 200/503 with SQLite verification)          │
│   • Metrics:        GET /metrics (Prometheus prom-client telemetry)              │
│   • Database:       /app/data/stockshare.db (better-sqlite3)                     │
└──────────────────────┬───────────────────────────────────┬───────────────────────┘
                       │                                   │
                       ▼                                   ▼
┌──────────────────────────────────────────────┐  ┌────────────────────────────────┐
│   Volume: stockshare-data                    │  │   prometheus (Port 9090)       │
│   • Persistent SQLite database storage       │  │   • Scrapes backend:5000       │
└──────────────────────────────────────────────┘  └───────────────┬────────────────┘
                                                                  │
                                                                  ▼
                                                  ┌────────────────────────────────┐
                                                  │   grafana (Port 3000)          │
                                                  │   • StockShare Overview Dash   │
                                                  │   • Provisioned Prometheus DS  │
                                                  └────────────────────────────────┘
```

---

## Services & Port Mappings

| Service | Container Name | Host Port | Internal Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `stockshare-frontend` | `8081` | `80` | React 19 SPA served via Nginx |
| **Backend API** | `stockshare-backend` | `5000` | `5000` | Express REST API & Health checks |
| **Prometheus** | `stockshare-prometheus` | `9090` | `9090` | Prometheus Time-Series Scraper |
| **Grafana** | `stockshare-grafana` | `3000` | `3000` | Telemetry & Observability Dashboard |

---

## Prerequisites

- **Node.js**: `v20.x` or `v24.x`
- **npm**: `v10.x` or `v11.x`
- **Docker Desktop**: With Docker Engine and Docker Compose enabled
- **Windows PowerShell** or terminal of choice

---

## Quick Start with Docker Compose

### 1. Validate Configuration
```powershell
docker-compose config
```

### 2. Build and Start Full Stack
To build and launch all services in detached mode:
```powershell
docker-compose up -d --build
```

### 3. Check Service Status
```powershell
docker-compose ps
```

### 4. Service URLs
- **StockShare Web Application**: [http://localhost:8081](http://localhost:8081)
- **Backend API Root**: [http://localhost:5000](http://localhost:5000)
- **Backend Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **Backend Prometheus Metrics**: [http://localhost:5000/metrics](http://localhost:5000/metrics)
- **Prometheus UI & Targets**: [http://localhost:9090](http://localhost:9090)
- **Grafana Dashboards**: [http://localhost:3000](http://localhost:3000)

---

## Local Development (Without Docker)

You can run both frontend and backend locally for rapid feature development.

### 1. Backend Setup
```powershell
cd backend
npm install
npm test            # Runs isolated test suite
node server.js      # Runs backend on http://localhost:5000
```

### 2. Frontend Setup
In a new PowerShell window:
```powershell
cd frontend
npm install
npm run lint        # Verifies ESLint standards
npm run dev         # Launches Vite dev server on http://localhost:5173
```
*Note: Vite dev server automatically proxies all `/api/*` and `/health` requests to `http://localhost:5000`.*

---

## Monitoring & Observability

### Prometheus Configuration (`monitoring/prometheus/prometheus.yml`)
- Scrapes `localhost:9090` (Prometheus internal metrics)
- Scrapes `backend:5000/metrics` every 15 seconds
- Target health can be viewed at: [http://localhost:9090/targets](http://localhost:9090/targets)

### Grafana Dashboards (`monitoring/grafana/`)
- **Default Credentials**:
  - Username: `admin`
  - Password: `admin` (or defined in `GRAFANA_ADMIN_PASSWORD` in `.env`)
- **Datasource**: Pre-configured via `monitoring/grafana/provisioning/datasources/prometheus.yml` pointing to `http://prometheus:9090`.
- **Pre-provisioned Dashboard**: **StockShare Platform Overview** located in the `StockShare` folder:
  - Backend Process Availability
  - SQLite Database Health Indicator
  - HTTP Request Rate (RPS)
  - HTTP 4xx and 5xx Error Tracking
  - Real-time Inventory Item Count
  - Total Available Inventory Units
  - Pending, Approved, and Rejected Requests Counter
  - Latency quantiles (p95 and p50)
  - Traffic Breakdown by Status Code

---

## CI/CD Automation with Jenkins

The repository contains a declarative `Jenkinsfile` compatible with Windows Jenkins agents:
1. **Source Checkout**: Clones current git branch.
2. **Frontend Quality Gate**: Runs `npm ci`, `npm run lint`, and `npm run build`.
3. **Backend Quality Gate**: Runs `npm ci` and `npm test` against an isolated database.
4. **Compose Validation**: Runs `docker-compose config` to verify YAML schema.
5. **Image Build**: Builds both `frontend` and `backend` images.
6. **Deployment**: Deploys the stack with consistent project naming (`stockshare`).
7. **Health Verification**: Actively polls `http://localhost:5000/health` and probes Prometheus and Grafana.
8. **Diagnostic Reporting**: Gathers container logs on failure.

### Jenkins Environment Variables (Optional)
- `DOCKER_COMPOSE_BIN`: Custom path to `docker-compose.exe` if not using standard Docker Desktop path.
- `COMPOSE_PROJECT_NAME`: Enforced as `stockshare` to avoid dual-project port conflicts.

---

## Database Persistence & Backup Guidelines

### Database Storage
- SQLite file is stored at `/app/data/stockshare.db` inside the backend container.
- Persistent Docker volume: `stockshare-data`.

### Critical Preservation Rules
1. **Never run `docker-compose down -v`** (the `-v` flag removes named volumes).
2. **Safely stop the application**:
   ```powershell
   docker-compose down
   ```
3. **Backing up the SQLite database**:
   ```powershell
   # Create a timestamped backup from the running container
   docker cp stockshare-backend:/app/data/stockshare.db ./stockshare-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db
   ```
4. **Restoring a database backup**:
   ```powershell
   docker cp ./stockshare-backup.db stockshare-backend:/app/data/stockshare.db
   ```

---

## Troubleshooting

### Port Conflicts (5000, 8081, 9090, 3000)
If a port is already in use by another process:
```powershell
# Identify process using port (e.g. 5000)
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
```

### Inspecting Container Logs
```powershell
docker-compose logs backend
docker-compose logs frontend
docker-compose logs prometheus
docker-compose logs grafana
```

### Checking Backend Database Health Manually
```powershell
Invoke-RestMethod -Uri http://localhost:5000/health
```
Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 123.45,
  "timestamp": "2026-10-14T..."
}
```
