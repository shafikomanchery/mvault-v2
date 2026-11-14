# Store submission checklist

## Apple App Store

- [ ] Host `docs/privacy-policy.md` at a public URL
- [ ] Complete encryption export compliance (standard HTTPS + app crypto)
- [ ] App Privacy labels: email, user content (encrypted)
- [ ] EAS production build → TestFlight → review
- [ ] Screenshots: login list, unlock, recovery onboarding

## Google Play

- [ ] Data safety form: encrypted user data, account email
- [ ] Internal testing track via EAS submit
- [ ] Privacy policy link in Play Console

## Commands

```bash
cd apps/mobile
npx eas-cli build --profile preview --platform all
npx eas-cli submit --profile production --platform ios
```

Replace placeholder IDs in `apps/mobile/eas.json` before submit.
