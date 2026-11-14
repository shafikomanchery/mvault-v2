# Cryptographic specification (v1)

Normative format for mVault v2 vault encryption. See ADR-0003.

## Algorithms

| Operation | Algorithm | Parameters |
|-----------|-----------|------------|
| KDF (master) | PBKDF2 | HMAC-SHA256, 310_000 iterations, 16-byte salt |
| KDF (recovery) | SHA-256 | Recovery key UTF-8 → 32-byte key material |
| Encryption | AES-256-GCM | 12-byte IV, 128-bit tag |
| Vault key | Random | 32 bytes (`crypto.getRandomValues`) |

## Recovery key format

24 words from a fixed 2048-word list (BIP39-style encoding of 32 bytes + checksum), displayed grouped as `word1-word2-...`.

## Inner payload (before encryption)

```json
{
  "v": 1,
  "logins": [],
  "keyring": {
    "vaultKeyWrappedByMaster": { "salt": "<b64>", "iv": "<b64>", "ciphertext": "<b64>" },
    "vaultKeyWrappedByRecovery": { "iv": "<b64>", "ciphertext": "<b64>" }
  }
}
```

The blob stored on the server (`VaultSyncPort.ciphertext`) is JSON:

```json
{
  "v": 1,
  "keyring": { "vaultKeyWrappedByMaster": {}, "vaultKeyWrappedByRecovery": {} },
  "logins": { "iv": "<b64>", "ciphertext": "<b64>" }
}
```

The `logins` field encrypts `{ "v": 1, "logins": [] }` using the **vault key**.

## Wrapped vault key

- **By master:** AES-GCM encrypt vault key with key derived via PBKDF2(masterPassword, salt).
- **By recovery:** AES-GCM encrypt vault key with SHA-256(recoveryKeyPhrase normalized).

## Test vector (deterministic KDF spot-check)

See `packages/crypto/src/__tests__/vectors.test.ts`.
