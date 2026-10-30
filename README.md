# EngineerOS — The Complete Operating System for an Engineering Student

[![CI Pipeline](https://github.com/TusarGoswami/engineeeer_OS/actions/workflows/ci.yml/badge.svg)](https://github.com/TusarGoswami/engineeeer_OS/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**EngineerOS** is a unified, production-grade web platform engineered specifically for engineering students. It bridges academic curriculum, competitive coding (DSA), GATE examination preparation, AI learning assistance, proctored assessments, and senior/alumni mentorship into a coherent, high-performance operating system.

---

## 1. System Architecture Highlights

- **Modular Monolith**: 12 strictly isolated domain modules (`auth`, `users`, `dashboard`, `academics`, `coding`, `gate`, `ai-assistant`, `assessments`, `community`, `interviews`, `progress`, `notifications`, `admin`).
- **Dual Process Runtime**: Decoupled HTTP API node (`server.js`) and BullMQ background worker (`worker.js`).
- **Offline / Zero-Key Portability**: High-fidelity mock adapters for Judge0 sandboxed execution, Anthropic Claude LLM, and SES email dispatches enable full offline local development and test runs with zero external API keys.
- **Pre-Aggregated Progress**: Event-driven architecture pipes `activityEvents` through BullMQ workers into `progressSummaries`, guaranteeing sub-30ms dashboard response times.
- **Server-Sent Events (SSE)**: Real-time token streaming for AI chat and submission execution without the stateful connection overhead of WebSockets.

Comprehensive design documents:

- [System Architecture & Scaling Plan](docs/ARCHITECTURE.md)
- [Architectural Decision Records (ADRs)](docs/DECISIONS.md)
- [Phased Implementation Plan](docs/IMPLEMENTATION_PLAN.md)

---

## 2. Technology Stack

| Domain           | Technology                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| **Frontend**     | React 18, Vite, React Router, Tailwind CSS, TanStack Query, React Hook Form + Zod, Recharts, Monaco Editor |
| **Backend**      | Node.js 20, Express (ES Modules), Mongoose, Zod, Pino, Helmet, CORS                                        |
| **Data & Cache** | MongoDB 7.0 (Replica Set `rs0` for transactions), Redis 7 (Queues, Cache, Limits)                          |
| **Queue Worker** | BullMQ                                                                                                     |
| **Code Sandbox** | Judge0 API adapter + Built-in offline mock sandbox                                                         |
| **AI Assistant** | Anthropic Claude adapter + Built-in offline mock LLM                                                       |
| **DevOps**       | Docker, Docker Compose, Nginx reverse proxy, GitHub Actions CI                                             |

---

## 3. Quick Start

### Option A: Local Development (Recommended)

#### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Local MongoDB and Redis instances (or via Docker Compose: `docker compose up mongo redis judge0-stub -d`)

#### Setup Steps

```bash
# 1. Clone repository
git clone https://github.com/TusarGoswami/engineeeer_OS.git
cd engineer_os

# 2. Install monorepo dependencies
npm install

# 3. Configure environment files
cp server/.env.example server/.env

# 4. Seed database with realistic curriculum and problem sets
npm run seed

# 5. Start development servers (API, Worker, Client concurrently)
npm run dev
```

The application will be accessible at:

- **Client**: `http://localhost:3000`
- **API Server**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/healthz`

---

### Option B: Docker Compose (Full Stack)

To run the complete production topology (Nginx, API, BullMQ Worker, MongoDB Replica Set, Redis, and Judge0 Stub):

```bash
docker compose up --build -d
```

Access the platform at `http://localhost` (via Nginx reverse proxy on port 80).

---

## 4. Verification & Testing

```bash
# Run linters across all workspaces
npm run lint

# Verify code formatting
npm run format:check

# Run backend unit and integration tests (in-memory MongoDB)
npm run test:server

# Run frontend unit and component tests
npm run test:client

# Production build validation
npm run build
```

---

## 5. Repository Structure

```
engineeros/
├── client/                 # React 18 + Vite frontend
│   ├── src/
│   │   ├── app/            # Router, Providers, Query Client
│   │   ├── components/     # Reusable UI kit (Buttons, Modals, Tables, etc.)
│   │   ├── features/       # Domain feature pages & components
│   │   ├── layouts/        # Dashboard and Public layouts
│   │   └── services/       # Axios client and API endpoints
├── server/                 # Express API & BullMQ worker
│   ├── src/
│   │   ├── config/         # Zod env schema, MongoDB, Redis, Logger
│   │   ├── middleware/     # Auth, RBAC, Validation, Rate Limit, Error
│   │   ├── modules/        # 12 isolated domain modules
│   │   ├── integrations/   # Judge0, LLM, Storage, Email adapters + mocks
│   │   ├── jobs/           # BullMQ queues and worker consumers
│   │   ├── server.js       # HTTP API entry point
│   │   └── worker.js       # Background worker entry point
├── docs/                   # Architecture, ADRs, Implementation Plans, Indexes
├── nginx/                  # Nginx reverse proxy configuration
├── judge0-stub/            # Offline mock sandbox container
└── docker-compose.yml      # Local orchestration
```

---

## 6. Author & Maintainer

Designed and engineered by **Tusar Goswami**

- GitHub: [@TusarGoswami](https://github.com/TusarGoswami)
- Email: [tusarg937@gmail.com](mailto:tusarg937@gmail.com)
- Project Repository: [https://github.com/TusarGoswami/engineeeer_OS](https://github.com/TusarGoswami/engineeeer_OS)
