# Shprclb MVP - E-commerce Platform

Minimal e-commerce MVP with warehouse-specific pricing, quantity-based pricing, and backorder support.

## Stack

- **Medusa v2** - E-commerce engine
- **NestJS + Fastify** - BFF (Backend-for-Frontend)
- **Next.js + shadcn/ui** - Storefront
- **PostgreSQL** - Database

## Quick Start (Local Development)

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Install dependencies (run once)
cd packages/medusa && npm install
cd ../bff && pnpm install
cd ../storefront && pnpm install

# 3. Run Medusa migrations (first time only)
cd packages/medusa
npx medusa db:migrate

# 4. Start all services (in separate terminals)

# Terminal 1: Medusa
cd packages/medusa && npm run dev

# Terminal 2: BFF
cd packages/bff && pnpm start:dev

# Terminal 3: Storefront
cd packages/storefront && pnpm dev
```

## Services

| Service    | URL                      |
|------------|--------------------------|
| Storefront | http://localhost:3000    |
| BFF API    | http://localhost:3001    |
| Medusa API | http://localhost:9000    |
| Medusa Admin | http://localhost:9000/app |

## Project Structure

```
shprclb-mvp/
├── docker-compose.yml     # PostgreSQL only
├── packages/
│   ├── storefront/        # Next.js frontend
│   ├── bff/               # NestJS BFF layer
│   └── medusa/            # Medusa v2 backend
```

## Cleanup Docker

```bash
# Stop postgres
docker compose down

# Remove postgres data (WARNING: deletes all data)
docker compose down -v
```

## MVP Features (Planned)

- [X] Warehouse-specific SKU inventory & pricing
- [X] MOQ / Quantity-based pricing tiers
- [ ] Backorder support
- [ ] Order splitting by warehouse
