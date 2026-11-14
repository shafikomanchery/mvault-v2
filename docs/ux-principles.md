# UX principles

## Progressive disclosure

1. Account sign-in (email + account password)
2. Unlock vault (master password or biometrics)
3. Login list as home

Recovery kit, encrypted backup, and account deletion live under **Settings**.

## Sync and lock states

Always show one of: **Locked**, **Unlocking**, **Synced**, **Syncing**, **Offline**, **Conflict**.

Use plain language in a header chip or settings row — not error codes.

## Primary actions

- One tap to copy username
- One tap to copy password
- Optional clipboard clear after 30 seconds (settings)

## Onboarding

- Short steps with clear titles
- Recovery key: user must enter **3 words** from the key before continuing
- No “checkbox only” for recovery acknowledgment

## Errors

Map port errors to actionable copy in `apps/mobile/src/errors.ts`:

- Wrong master password
- Check internet connection
- Sync conflict — open resolver

## Accessibility

- Minimum 44pt tap targets
- `accessibilityLabel` on icon-only buttons
- Respect system font scaling
