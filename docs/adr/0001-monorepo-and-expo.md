# ADR-0001: Monorepo and Expo for mobile

## Status

Accepted

## Context

Need iOS and Android from one codebase with fast iteration.

## Decision

npm workspaces monorepo; `apps/mobile` uses Expo SDK 52 and expo-router.

## Consequences

- Shared packages for crypto and domain
- Native autofill requires dev builds in Phase 2

## Alternatives

- Flutter (rejected: team learning React Native)
- Capacitor wrapper (rejected: weaker PM ecosystem)
