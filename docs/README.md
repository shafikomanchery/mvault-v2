# mVault v2 documentation

Design and architecture documentation for the mVault v2 password manager.

## Reading order

1. [Threat model](./threat-model.md) — what we protect and from whom
2. [Crypto spec](./crypto-spec.md) — vault format and algorithms
3. [Sync protocol](./sync-protocol.md) — blob sync contract (backend-agnostic)
4. [UX principles](./ux-principles.md) — product UX conventions
5. [Architecture layers](./architecture/layers.md) — SOLID package map
6. [Ports and adapters](./architecture/ports-and-adapters.md) — swapping backends
7. [ADRs](./adr/README.md) — decision log

## Glossary

| Term | Meaning |
|------|---------|
| **Account password** | Credentials for API login (JWT). Never decrypts the vault. |
| **Master password** | User secret that unwraps the vault key on device only. |
| **Recovery key** | Random secret shown once at signup; unwraps vault key if master password is lost. |
| **Vault key** | Random 256-bit AES key; encrypts login data. |
| **Zero-knowledge (ZK)** | Server stores only ciphertext; cannot read logins. |
