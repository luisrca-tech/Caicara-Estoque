# Caiçara Stock

**Team**
- Lucas Damaceno de Assis Santos
- Ana Beatriz Damaceno de Assis Santos
- Luis Felipe da Rocha Cruz Alves Oliveira

🎥 [Project walkthrough](https://www.youtube.com/watch?v=GFsTN0_M9Bg)

## Overview
Caiçara Stock is a stock-management dashboard tailored for small beverage businesses. It centralizes product registration, quantity adjustments, disabled-item recovery, and order visibility in a responsive interface built with a modern T3 stack foundation.

## Tech Stack
- **Next.js 15 (App Router + RSC)** for the web layer
- **React 19** with Suspense-ready client components
- **Bun** as the package manager/runtime
- **tRPC 11** for type-safe APIs between client and server
- **Drizzle ORM + PostgreSQL** for the data layer
- **Tailwind CSS + Radix UI + shadcn/ui primitives** for styling and accessibility
- **TanStack Query** for data fetching/caching
- **nuqs** to keep filters synchronized with the URL

## Prerequisites
- [Bun](https://bun.sh/) ≥ 1.1 (ships with the project lockfile)
- Node.js 20+ (Bun uses it under the hood)
- Docker Desktop / Docker Engine for the local PostgreSQL container

## Environment Variables
Create a `.env` file at the project root:

```
DATABASE_URL="postgres://postgres:dev123@localhost:5432/caicara-stock"
```

- `DATABASE_URL` points to the local Postgres container created by `start-database.sh`. Adjust host, port, or credentials for staging/production.

## Local Setup
```bash
bun install
```

1. **Start PostgreSQL via Docker**
   ```bash
   ./start-database.sh
   ```
   - Spins up (or resumes) a container named `caicara-stock-postgres`.
   - Default credentials: `postgres / dev123`.

2. **Apply database migrations**
   ```bash
   bun run db:migrate
   ```
   - `bun run db:generate` emits SQL from schema updates.
   - `bun run db:push` synchronizes schema diffs without SQL files.

3. **Run the development server**
   ```bash
   bun run dev
   ```
   The app will be available at `http://localhost:3000`.

## Quality & Build Commands
- `bun run typecheck` – strict TypeScript validation
- `bun run check` – Biome linting/formatting checks
- `bun run build` – optimized Next.js production build
- `bun run preview` – build and serve via `next start`

## Docker Notes
- `start-database.sh` handles idempotent container startup (creates if missing, resumes if paused).
- Inspect or connect to the database with any PostgreSQL client using the same `DATABASE_URL`.
- Optional cleanup:
  ```bash
  docker stop caicara-stock-postgres
  docker rm caicara-stock-postgres
  ```

## Deployment
- Works on any platform that supports Next.js 15 + Node 20 (Vercel, Netlify, Docker, etc.).
- Configure `DATABASE_URL` (and any other secrets) in the target environment before running `bun run build`.

