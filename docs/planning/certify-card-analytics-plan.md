# Certify Card Analytics Plan

## Overview

Add server-side event tracking to measure drop-off at the CertifyCard step. The goal is to know: of all anonymous users who see the certify card, how many enter their phone number versus swipe it away?

---

## Events to Track

| Event | Fired When |
|---|---|
| `certify_card_shown` | The certify card mounts (i.e. renders into the swipe stack for the first time) |
| `certify_card_phone_submitted` | User taps send and the SMS code is sent successfully |
| `certify_card_verified` | User successfully verifies the code (onSuccess fires) |
| `certify_card_dismissed` | User swipes the card away without submitting a phone number |

The primary conversion rate is `certify_card_phone_submitted / certify_card_shown`.
`certify_card_verified / certify_card_phone_submitted` is a secondary signal (SMS delivery / OTP completion rate).

---

## Database Table

New Supabase table **`analytics_events`**:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key, `gen_random_uuid()` |
| `event` | text | event name, e.g. `certify_card_shown` |
| `userId` | text | nullable — anonymous users won't have one yet at `shown` time |
| `roomId` | text | nullable |
| `createdAt` | bigint | `Date.now()` timestamp |

No `metadata` column for now — keeping it minimal. Can always add columns later.

---

## API Endpoint

`POST /make-server-f1a393b4/analytics/event`

- Auth: public (no session required — certify card is shown to anonymous users)
- Body: `{ event: string, roomId?: string }`
- Gets `userId` from session middleware if present, otherwise `null`
- Inserts one row into `analytics_events`
- Always returns `200` — fire-and-forget, never block the UI on this

---

## Client

`api.trackEvent(event, roomId?)` on the main `ApiClient` in `src/utils/api.tsx`:
- Delegates to `BaseApiClient.post` so it reuses the same auth headers as all other calls
- No-ops silently when `showComponentShowcase` is set in localStorage (prevents events firing during component stories)
- Fire-and-forget — `.catch(() => {})` swallows errors silently
- Never awaited by calling code

---

## Instrumentation Points

| Event | File | Where |
|---|---|---|
| `certify_card_shown` | `CertifyCard.tsx` | `useEffect` on mount |
| `certify_card_phone_submitted` | `CertifyCard.tsx` | Inside `handleSendCode`, after `response.success` |
| `certify_card_verified` | `CertifyCard.tsx` | Inside `handleVerify`, after `response.success` |
| `certify_card_dismissed` | `SwipeableStatementStack.tsx` | Inside `handleDragEnd`, when `card.type === "certify"` |

---

## Corner Cases

1. **`certify_card_shown` fires more than once** — no guard needed; the component unmounts when dismissed so it can only mount once per session.
2. **Anonymous user has no userId** — the endpoint accepts a null userId, so this is fine. We still get the event count.
3. **Network failure on track call** — swallowed silently, as intended. Analytics loss is acceptable; never degrade the UX.
4. **Showcase / component stories** — `trackEvent` is a no-op when `showComponentShowcase` is set in localStorage.

---

## Querying the Data

Once data is flowing, the conversion rate can be queried directly in the Supabase dashboard:

```sql
SELECT
  event,
  COUNT(*) AS count
FROM analytics_events
WHERE event LIKE 'certify_card_%'
GROUP BY event
ORDER BY count DESC;
```

---

## Code Organisation Notes

- `insertAnalyticsEvent` helper lives in `model-utils.ts`, following the same `insert` pattern used for `user_reports`, `flyer_emails`, etc.
- Server endpoint is in `analytics-api.ts`, registered in `index.tsx`, uses the `defineRoute` wrapper.
- `api.trackEvent` lives on the main `ApiClient` in `api.tsx` — no separate analytics utility file.
