# mVault v2

Zero-knowledge synced password manager (Expo + custom API).

## Docs

See [docs/README.md](./docs/README.md) and [docs/adr](./docs/adr/README.md).

## Quick start

```bash
docker compose up -d
cp .env.example .env
npm install
npm run migrate -w @mvault/api
npm run api:dev
npm run mobile:start
```

## Workspaces

- `apps/mobile` — Expo app
- `packages/*` — crypto, core, ports, adapters
- `services/api` — Hono + Postgres
