# Ports and adapters

## Adding a backend

1. Write an ADR describing the backend.
2. Implement `AuthPort` and `VaultSyncPort` in `packages/adapters-<name>/`.
3. Add package to contract test suite in `packages/adapters-custom-api` (shared tests).
4. Register adapter in `apps/mobile/src/di/container.ts` via `EXPO_PUBLIC_BACKEND`.

## Ports

- `AuthPort` — register, login, refresh, logout
- `VaultSyncPort` — pullVault, pushVault
- `SecureStoragePort` — get/set/delete opaque strings
- `ClockPort` — now() for tests

## Server-side repositories

Inside `services/api`, `UserRepository` and `VaultRepository` abstract Postgres. Swapping to another DB does not affect mobile ports if HTTP contract is unchanged.
