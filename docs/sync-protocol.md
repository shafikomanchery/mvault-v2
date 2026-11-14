# Sync protocol

Backend-agnostic contract implemented by `VaultSyncPort`. HTTP mapping is the reference for `@mvault/adapter-custom-api`.

## Vault envelope

```ts
interface VaultEnvelope {
  revision: number;
  ciphertext: string; // base64 outer blob JSON { iv, ciphertext }
  updatedAt: string; // ISO-8601
}
```

## Operations

### pullVault()

Returns latest `VaultEnvelope` or `null` if user has no vault yet.

### pushVault(envelope, expectedRevision)

- If `expectedRevision` matches server: store new ciphertext, increment revision, return new envelope.
- If mismatch: throw `SyncConflictError` with server envelope in `cause`.

## HTTP reference (custom API)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/register` | — | `{ email, password }` |
| POST | `/auth/login` | — | returns `{ accessToken, refreshToken }` |
| POST | `/auth/refresh` | — | `{ refreshToken }` |
| GET | `/v1/vault` | Bearer | returns envelope |
| PUT | `/v1/vault` | Bearer | body `{ ciphertext }`, header `If-Match: <revision>` |
| DELETE | `/v1/account` | Bearer | deletes user and vault |

## Conflict merge (client)

On `SyncConflictError`, decrypt both copies, merge logins by `id` (higher `updatedAt` wins), re-encrypt, retry push once.
