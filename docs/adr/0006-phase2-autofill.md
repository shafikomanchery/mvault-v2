# ADR-0006: Platform autofill (Phase 2)

## Status

Proposed

## Context

Store password managers expect system autofill on mobile.

## Decision

Phase 2: Expo dev client; Android `AutofillService`; iOS `ASCredentialProvider` extension with shared Keychain access group.

## Consequences

- Separate native modules and ADR updates before shipping autofill
- MVP ships without autofill

## Alternatives

- Ship MVP without autofill (accepted for Phase 1)
