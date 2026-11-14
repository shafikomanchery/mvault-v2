# Architecture layers (SOLID)

| Package | Responsibility | Depends on |
|---------|----------------|------------|
| `@mvault/ports` | Interfaces only | — |
| `@mvault/crypto` | Pure cryptography | — |
| `@mvault/core` | Domain + use-cases | ports, crypto |
| `@mvault/adapter-custom-api` | HTTP client adapters | ports |
| `@mvault/adapter-supabase` | Stub / future | ports |
| `@mvault/api` | HTTP server + Postgres repos | — |
| `@mvault/mobile` | UI + composition root | core, ports, adapters |

**Rule:** `core` never imports `fetch`, `pg`, or React.
