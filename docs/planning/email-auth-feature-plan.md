# Email Auth Feature Plan

## Overview

Replace phone number as the primary sign-up and sign-in method with email + OTP code. Phone verification becomes a secondary, optional step users can complete later from their profile. Legacy phone-only accounts retain the ability to sign in via phone number indefinitely.

---

## Assumptions

- Email OTP codes are sent via the existing Resend integration (already used for welcome emails and newsletters).
- Twilio remains in place for the optional phone verification step post-signup.
- A user's email is already stored on the `User` record and indexed under `user_email:{normalizedEmail}` in KV — this infrastructure is already there.
- We do not force existing phone-only users to add an email until they choose to.

---

## User Flows

### New Sign-Up
1. User opens auth modal → sees email input with autocomplete
2. User enters email → taps "Send Code"
3. Server sends 6-digit OTP to that email via Resend
4. User enters code → account is created, session starts
5. Onboarding continues as normal (nickname, ToS, etc.)
6. Phone verification is offered as an optional step later ("Verify your account with a phone number")

### Returning User — Email Account
1. User opens auth modal → enters email → taps "Send Code"
2. Server recognises email, sends OTP
3. User enters code → existing session restored

### Returning User — Legacy Phone-Only Account
1. User opens auth modal → enters email → "No account found"
2. A "Sign in with phone number instead" fallback link is shown
3. User taps it → existing phone OTP flow (unchanged)
4. After login, they are prompted to add an email to their account

### Returning User — Account Has Both Email and Phone
- Email path works as above; phone path also still works.

---

## Data Model

No new KV keys needed. The existing infrastructure already supports this:

| KV Key | Value | Notes |
|---|---|---|
| `user_email:{normalizedEmail}` | `userId` | Already exists |
| `user:{userId}` | `User` record | `email` field already present |

New fields to add to the `User` type:

| Field | Type | Notes |
|---|---|---|
| `emailVerified` | `boolean` | Set `true` on first successful email OTP |
| `emailVerifiedAt` | `number` | Timestamp |

---

## API Endpoints

New endpoints (mirroring the SMS flow):

- `POST /auth/send-email-code` — generates a 6-digit OTP, stores it with a 10-minute TTL in KV (`email_otp:{normalizedEmail}`), sends it via Resend. Accepts `{ email, requireExisting?: boolean }`.
- `POST /auth/verify-email-code` — checks the OTP, creates or logs in the user, merges anonymous activity, returns `{ user, sessionId }`. Accepts `{ email, code, tosAcknowledged, privacyPolicyAcknowledged }`.

Existing endpoints that stay unchanged:
- `POST /auth/send-sms-code`
- `POST /auth/verify-sms-code`
- `POST /auth/add-phone-to-account`

---

## OTP Storage

Store the OTP in KV with a short TTL:

| KV Key | Value | TTL |
|---|---|---|
| `email_otp:{normalizedEmail}` | `{ code, createdAt, attempts }` | 10 minutes |

- After 3 failed attempts, invalidate the record and require a new code.
- Normalise email to lowercase before keying.

---

## Frontend Changes

### Auth Modal / Sign-In Screen
- Email input becomes the primary field (with `type="email"` and `autocomplete="email"` for native autocomplete on mobile)
- "Sign in with phone number instead" fallback link beneath the form — visible always, not hidden
- The phone OTP flow is preserved behind this link, unchanged

### Sign-Up Flow
- Replace `PhoneCollectionStep` as the first step with an `EmailCollectionStep`
- Phone verification (`PhoneCollectionStep`) moves to a post-signup optional prompt, similar to how the certify card works today
- The `PhoneVerificationDialog` stays for users who want to add/verify their phone later

---

## Corner Cases

1. **Email already in use by another account** — `verify-email-code` should check the `user_email` index before creating a new account and return a clear error rather than creating a duplicate.
2. **Phone-only legacy user tries email sign-up with a new email** — a brand new account is created, separate from their phone account. They will have two accounts. Mitigation: after phone login, prominently prompt them to add their email so future email sign-ins land on the right account.
3. **OTP replay / brute force** — invalidate the OTP immediately after a successful verification. Enforce the 3-attempt limit and 10-minute TTL server-side.
4. **Email typo at sign-up** — user is locked out of a fresh account. Mitigation: show the entered email clearly on the code entry screen with a "wrong email?" back link.
5. **Resend deliverability / spam folder** — add clear copy on the code entry screen: "Check your spam folder if you don't see it within a minute." Consider a resend-code option with a 60-second cooldown.
6. **Anonymous user converting** — same merge logic that exists today for phone applies to email: anonymous activity (votes, statements) is transferred to the new/existing account on successful verify.
7. **User has both email and phone — signs in via phone** — the phone flow resolves to the same `userId` as the email, so there is no duplicate session issue.
8. **Existing `emailVerified` state** — some users may already have an email on their record (added via the existing `add-email-to-account` endpoint) but `emailVerified` is not set. Treat a successful email OTP as retroactively verifying that email.

---

## Testing

- Story for the new `EmailCollectionStep` component.
- Story for the updated auth modal showing the phone fallback link.
- Unit tests for OTP generation, TTL expiry, and attempt limiting on the server.
- Manual test matrix: new signup, returning email user, legacy phone user via fallback, anon conversion.

---

## Code Organisation Notes

- Mirror the structure of the SMS endpoints in `auth-login-api.ts` — keep email OTP logic in the same file for consistency.
- Reuse `loginUserWithMerge` from `auth-utils.ts` — it already handles anonymous merging regardless of auth method.
- Do not call auth API directly from components — go through `useDebateSession` as today.
- Use the `defineRoute` wrapper for new endpoints.
