# ADR-0003: Zero-knowledge vault key model

## Status

Accepted

## Context

Master password recovery and biometrics require a random vault key wrapped by multiple secrets.

## Decision

Random 256-bit vault key encrypts payload; master password and recovery key each wrap the vault key (see crypto-spec).

## Consequences

- Master password change re-wraps vault key only
- Server never receives master password

## Alternatives

- Password-derived key only (rejected: poor recovery story)
