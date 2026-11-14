# Threat model (draft)

## Assets

- Master password, recovery key, vault key (client memory / secure storage)
- Encrypted vault blob (client + server)
- JWT refresh tokens (client secure storage)
- Account email and password hash (server only)

## Trust boundaries

```text
[User device]  --TLS-->  [API + Postgres]  (ciphertext + auth metadata only)
```

The server is **untrusted** for vault plaintext. Compromise of the server must not reveal logins without the master password or recovery key.

## Adversaries

| Adversary | Goal | Mitigations |
|-----------|------|-------------|
| Network attacker | Read/modify traffic | TLS, AES-GCM, revision checks |
| Server operator | Read user passwords | ZK blob; no master password on server |
| Malware on device | Exfiltrate vault after unlock | Idle lock, biometrics, OS sandbox |
| Offline attacker with backup | Decrypt blob | KDF + strong master password |

## Out of scope (MVP)

- Nation-state physical device extraction
- Autofill extension attack surface (Phase 2 ADR)
