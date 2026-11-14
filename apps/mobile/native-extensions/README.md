# Phase 2: Native autofill extensions

See [ADR-0006](../../docs/adr/0006-phase2-autofill.md).

## Android

- Add `AutofillService` in a config plugin or `android/` after `expo prebuild`
- Package: `com.mvault.autofill`
- Requires dev client (`eas build --profile development`)

## iOS

- Add `ASCredentialProvider` extension target
- Shared Keychain access group: `group.com.mvault.shared`
- Coordinate with `expo-secure-store` key wrapping in main app

## Status

Not implemented in MVP. Main app ships copy/paste flows first.
