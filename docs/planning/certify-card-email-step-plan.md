# Certify Card — Email Step Plan

## Overview

Replace the phone-based certify flow with an email-only flow. The card cannot be swiped or skipped — the user must submit their email. Once submitted, a brief celebration screen plays, then the card auto-swipes away.

---

## New Step Sequence

```
email → celebration → [auto-swipe away]
```

| Step | What the user sees |
|---|---|
| `email` | Email input — card is unswipeable |
| `celebration` | Celebratory interstitial — auto-advances then calls `onSuccess` |

---

## Frontend Changes

- `CertifyCard.tsx` will be the primary component to be worked on.
- New mini components for the two steps: `CertifyEmailStep` and `CertifyCelebrationStep`.
- Phone/code/success steps are removed entirely.

### Card behaviour

- `isUnswipeable: true` is set on the certify card in `SwipeableStatementStack`, preventing drag gestures.
- `onSuccess` is called after the celebration step completes, which triggers the existing `swipeCertifyCard` animation.

### Analytics events

| Event | When |
|---|---|
| `certify_card_shown` | Card mounts |
| `certify_card_email_submitted` | After `createAccountWithEmail` succeeds |

---

## Corner Cases

1. **Invalid email** — validate client-side; show inline error; stay on email step.
2. **Email already registered to another account** — surface server error inline; stay on email step.
3. **Network failure** — show inline error; user can retry.
4. **Celebration timeout fires after unmount** — cleanup via `useEffect` return.
