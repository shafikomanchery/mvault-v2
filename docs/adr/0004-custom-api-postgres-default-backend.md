# ADR-0004: Custom API and Postgres as default backend

## Status

Accepted

## Context

Learning goal includes owning the API layer; need swappable storage.

## Decision

`services/api` with Hono + `pg`; repositories behind interfaces. Mobile uses HTTP adapter.

## Consequences

- Operate Postgres in staging/production
- Clear mapping to sync-protocol.md

## Alternatives

- Supabase first (deferred to adapter package)
