# Taleem AI — Base Module

Multi-module NestJS platform foundation handling **tenant management**, **authentication**, **registration**, and **OAuth** flows. This is the shared base module; domain-specific modules (Alumni, Admissions, etc.) will plug in as separate apps.

## Architecture

```
taleem-ai-cms-base-module/
├── apps/
│   └── base-api/              # Base module HTTP API
│       └── src/modules/
│           ├── tenant/        # Tenant onboarding & lifecycle
│           ├── auth/          # Registration, login, JWT
│           ├── user/          # Platform user identity
│           ├── oauth/         # OAuth 2.0 authorization server (stub)
│           └── rbac/          # Platform-scoped roles (stub)
├── libs/
│   ├── common/                # Shared decorators, base types, repository contracts
│   ├── config/                # Typed configuration (ConfigModule)
│   └── database/              # TypeORM PostgreSQL bootstrap
├── docker/                    # Docker Compose + Dockerfile
├── migrations/sql/            # Versioned PostgreSQL migrations (from Excel schema)
└── scripts/                   # Migration runner
```

### Design principles

| Principle | Implementation |
|-----------|----------------|
| **Single Responsibility** | Each module owns one bounded context (tenant, auth, user) |
| **Open/Closed** | Repository interfaces allow swapping persistence without changing services |
| **Liskov Substitution** | `ITenantRepository`, `IUserRepository` with TypeORM adapters |
| **Interface Segregation** | Narrow repository contracts per aggregate |
| **Dependency Inversion** | Services depend on `Symbol`-based repository tokens, not concrete classes |

### Module internal layout (per bounded context)

```
modules/<context>/
├── domain/           # Types, enums, repository interfaces
├── application/      # Services, DTOs, use cases
├── infrastructure/   # TypeORM entities, guards, strategies
└── presentation/     # Controllers
```

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- npm

## Quick start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start PostgreSQL + Redis (+ API in dev mode)
npm run docker:up

# 3. Install dependencies (if running API locally)
npm install

# 4. Run migrations (when DB already exists / re-applying)
npm run migration:run

# 5. Start API locally (without Docker API container)
npm run start:dev
```

API base URL: `http://localhost:3000/api/v1`

### Health check

```bash
curl http://localhost:3000/api/v1/health
```

## Database

- **Engine:** PostgreSQL 16
- **Schema:** `taleem-ai-base`
- **Migrations:** `migrations/sql/` (derived from *Taleem AI BASE MODULE.xlsx*)

Tables include: `tenants`, `tenant_contacts`, `tenant_addresses`, `applications`, `subscriptions`, `tenant_entitlements`, `users`, `user_identities`, `tenant_memberships`, `roles`, `permissions`, `oauth_clients`, `sessions`, `authorization_codes`, `refresh_tokens`, `audit_events`, and more.

On first Docker Postgres startup, migrations run automatically via `docker/postgres/init/00-run-migrations.sh`.

## API endpoints (initial)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | Public | Service health |
| POST | `/api/v1/auth/register` | Public | User registration |
| POST | `/api/v1/auth/login` | Public | User login (JWT) |
| POST | `/api/v1/tenants` | JWT | Create tenant |
| GET | `/api/v1/tenants` | JWT | List tenants |
| GET | `/api/v1/tenants/:id` | JWT | Get tenant |
| PATCH | `/api/v1/tenants/:id` | JWT | Update tenant |

## Docker services

| Service | Port | Purpose |
|---------|------|---------|
| `postgres` | 5432 | Primary database |
| `redis` | 6379 | Session/cache (future use) |
| `base-api` | 3000 | NestJS API (dev container) |

```bash
npm run docker:up      # Start all services
npm run docker:down    # Stop services
npm run docker:logs    # Tail logs
```

## Adding future modules

1. Create `apps/<module>-api/` following the same layered structure.
2. Register the project in `nest-cli.json`.
3. Add a service entry in `docker/docker-compose.yml` when ready.

## License

UNLICENSED — private project.
