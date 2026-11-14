# ADR-0002: Ports and adapters for sync and auth

## Status

Accepted

## Context

Default backend is custom API + Postgres; Supabase may be used later.

## Decision

Define `AuthPort` and `VaultSyncPort` in `@mvault/ports`. Implement `CustomApiAdapter` first; stub `SupabaseAdapter`.

## Consequences

- Use-cases depend on interfaces only
- Contract tests prevent adapter drift

## Alternatives

- Direct fetch in UI (rejected: violates DIP)
