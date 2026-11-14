# ADR-0005: Blob sync and conflict policy

## Status

Accepted

## Context

Multi-device edits can race on the single vault blob.

## Decision

Optimistic locking with `revision` and `If-Match`. On 409, merge logins by id (`updatedAt` wins), retry once; else user resolver UI.

## Consequences

- Simple server schema
- Merge logic in `@mvault/core`

## Alternatives

- Per-item sync API (deferred; port can extend later)
