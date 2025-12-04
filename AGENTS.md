# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by pnpm workspaces. Root scripts fan out to each package.
- `packages/ia-lab-agentkit/`: core schemas, compiler, runtime FSM, tool-gating, ingest tools.
- `packages/ia-lab-api/`: Fastify API serving agents, versions, runs, ingest, and auth flows.
- `packages/ia-lab-console/`: Next.js console/marketing UI.
- `examples/`: sample AgentManifest JSON files. `data/`: ingested raw JSON. `scripts/` and `docker-compose.yml`: infra helpers (Postgres + Redis).

## Build, Test, and Development Commands
- Install: `pnpm install` (Node 20+, pnpm 9+ required).
- Run all dev servers: `pnpm dev` (parallel watcher per package). Per-package: `pnpm --filter ia-lab-api dev` or `pnpm --filter ia-lab-console dev`.
- Build: `pnpm build` (tsc/Next builds). Clean: `pnpm clean`.
- Type safety: `pnpm typecheck` or `pnpm --filter ia-lab-agentkit typecheck`.
- Lint/format: `pnpm lint`, `pnpm format` (Prettier writes changes). Console also supports `pnpm --filter ia-lab-console lint`.
- Data + DB: `docker compose up -d` for Postgres/Redis, `pnpm db:migrate`, `pnpm db:seed`, and optional `pnpm ingest:prototipe` to pull sample data.

## Coding Style & Naming Conventions
- TypeScript + ES modules everywhere; prefer explicit exports and typed interfaces.
- Prettier config: 2-space indent, single quotes, semicolons, 100-char width, trailing commas where valid.
- Keep filenames kebab-case; React components PascalCase; variables/functions camelCase; constants SCREAMING_SNAKE_CASE.
- Favor small, pure functions; keep runtime state machines declarative and colocated with schemas.

## Testing Guidelines
- No dedicated test runner is configured yet—add package-level tests alongside source (e.g., `src/__tests__/` or `src/*.spec.ts`).
- Minimum check before PR: `pnpm typecheck` and `pnpm lint`. For new modules, add lightweight unit tests and include fixture data in `data/` or local mocks.
- When adding API routes, cover happy/edge paths and schema validation. For UI, prefer component tests and story-like fixtures where possible.

## Commit & Pull Request Guidelines
- Use clear, imperative commits (Conventional Commits preferred: `feat:`, `fix:`, `chore:`). Keep scope small; include migrations or ingest changes in the same commit.
- PRs should describe intent, risks, and how to validate. Link issues/tickets, include screenshots for UI changes, and note any env vars or data prep steps.
- Ensure branch is rebased, checks pass, and `docker compose` services are addressed (migrations run) before requesting review.

## Security & Configuration
- Copy `.env.example` to `.env` per package; never commit secrets. Rotate API keys stored in local env only.
- Restrict external calls in ingest tools; validate schemas before writing to `data/` or the database.
