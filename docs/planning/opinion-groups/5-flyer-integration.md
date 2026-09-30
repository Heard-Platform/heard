# Phase 5: Flyer Integration

[← Overview](README.md)

## Goal

Replace the QR scan result dialog with the new flyer swipe screen. A flyer scan opens the swipe screen, the user swipes the flyer statement plus 5 more, sees their tribe, and saves their spot with their email. They then land in the main feed, focused on the flyer room, as they do today.

## Today

1. The flyer QR code opens `/flyer/[room id]/[statement id]/[vote]` (with an optional flyer group at the end). This is by far the most common flyer URL. `parseFlyerDataFromUrl` reads it and `App.tsx` calls `handleFlyerJoin`.
2. `voteViaFlyer` creates an anonymous user and records the flyer vote in one request. It returns the room, the vote percentages and a teaser statement.
3. `startRoomJoin(room.id)` sets the target room, so the lobby loads with the flyer room first, behind the dialog.
4. `QRScanResultDialog` shows the vote bars and an email step (`useEmailOtpFlow`).
5. On complete or close, `handleQrComplete` shows a welcome toast, puts the room in the URL and clears the dialog. The feed underneath is already focused on the room.

Steps 1–3 and 5 stay the same. Only step 4 changes. The few hardcoded routes (`/shirt-agree`, `/club-yes`, …) also go through `handleFlyerJoin`, so they get the new screen too.

## What the user sees

1. Scan → full-screen flyer swipe screen.
2. The first card replays their flyer vote, then they swipe 5 more. The minimap moves as they go.
3. The results screen shows their tribe. **Save my spot** opens the drawer, and they enter their email. The TOS line sits below the email box.
   - **New email:** added to their anonymous account and they're in. No verification.
   - **Email that already has an account:** this becomes a login. The drawer switches to a code step, and they enter the code we email them.
4. Once that's done, the screen closes and they're in the feed, on the flyer room, with a welcome toast.

**Just looking around**, **Not now** then close, and the ✕ button all drop them into the feed without an email, as closing the dialog does today.

## Wiring

### Container

A new `FlyerSwipeContainer` owns the data and state, and keeps `FlyerSwipeScreen` presentational:

- **Statements:** `getRoomStatements(room.id)`. The flyer statement is found by id.
- **Deck order:** fetched alongside the statements, so the first cards are already in cluster-aware order.
- **The 5 other cards, picked live.** This is the point of Phase 3's adaptive ordering: place the user in a cluster as fast as possible. `useOrderedStatements` (and so `nextDeckOrder`) runs over every unvoted statement in the room, with the flyer vote counted from the start.
  - After each swipe, it pulls the card that best separates the groups into the slot just behind what's on screen. That card can come from anywhere in the room, not just the first 5.
  - Only the 2 readable cards stay put: the current card and the one right behind it, which shows while dragging. The 3rd card is just a white edge, so it can change, and the pulled-forward card lands there. The screen takes only the `upcoming` cards (ordered, unswiped, trimmed to what's left of the 5) and a `total` fixed at load. It shows the flyer card, then `upcoming[0]`, with the next two behind.
  - **Consensus card is 3rd overall:** flyer, one lead card, consensus. A cleanup step at the end of every `nextDeckOrder` (`placeConsensus`) puts it exactly at its slot after every reorder, so it's locked there. The flyer flow always has the deck order before its first render, so this never touches a card on screen.
  - **No exploration cards.** They were removed from the deck order entirely (see Phase 3).
  - It stops adapting once the user is ≥ 85% placed, or after 8 votes.
  - **The feed doesn't use any of this.** Phase 3 originally wired it into the feed's swipe stack too. That was reverted here to keep the blast radius to the flyer flow.
  - Without a deck order, it's the room's usual order. Rooms with fewer than 5 other statements get a shorter deck, and the progress bar already adapts.
- **Votes:** kept in local state for the estimate. Each swipe also calls `voteOnStatement`, **except the flyer statement**, which `voteViaFlyer` already recorded. The intro card still calls `onVote` for it, so the container has to skip it.
- **Estimate and results:** `estimateClusterProbabilities(deckOrder, votes)` and `summarizeTribe(...)` once every card is voted, the same as the story does.
- **Email:** `useEmailOtpFlow`, passed down to the drawer. It already does what we want: `anonAddEmailAndLogin` returns `requiresOtp` only when the email belongs to an existing account, so new emails go straight through.
- **Done:** calls `onComplete({ reason })` with the same `"signup" | "otp-login" | "continue"` reasons the dialog uses, so `handleQrComplete` doesn't change.

### Server: cluster names and slots in the deck order

`MinimapCluster` needs `slot` and `name`, but the deck order's clusters only carry `stableId`, `size` and `voteRates`. The identity record already holds both (`ClusterIdentity.slot`, `naming.name`), so the deck order endpoint adds them. Names stay `null` when the naming switch is off, and `getClusterDisplayName` falls back to "Group A/B/C".

This keeps it to one request. No need to also call the analysis endpoint.

### Screen changes

- **Drawer code step.** `SaveSpotDrawer` takes the email flow as a prop instead of keeping its own email state. For emails that already have an account it switches to a login code step (code input, "Use a different email", error line). The drawer is rendered by the container, not by `FlyerResults`, which just calls `onSaveSpot`.
- **TOS line** below the email input. Reuses `TOSText`, which now takes `className` and `linkClassName` so it can use the flyer screen's hardcoded colours.
- **Already logged in.** A signed-in user who scans skips the email. **Save my spot** completes with `"continue"` straight away, as the dialog's button does today.
- **No clusters.** With no deck order, `tribeSummary` stays `null` and the screen would sit on "You found your tribe!" forever. Instead, show the Phase 4 empty state ("Opinion groups forming…") with the same Save my spot footer. Tribe name, badge and crossover card are hidden.
- **Error boundary** around the screen. If it throws, fall back to completing with `"continue"`, so the user still lands on the room.

### Stories

Stories for the end of the flow, so every sign-up path can be checked without scanning a real flyer. Because the drawer takes the email flow's state as props, each story can put it in any step with a mocked flow, without touching the server.

`src/stories/FlyerSignUp.story.tsx` (Flyer Sign-up in the showcase) opens straight on the results screen. It wraps the real `useEmailOtpFlow` in `DebateSessionProvider` with mocked auth calls that take 800ms, so the submitting state shows.

| Variant | Shows |
|---------|-------|
| Anon, new email | Save my spot → email + TOS → completes as `"signup"` |
| Anon, existing email | Submit switches to the code step. `ABC123` completes as `"otp-login"`, and any other code shows the error. |
| Already logged in | Save my spot completes as `"continue"` with no drawer |
| Room without groups yet | The "Opinion groups forming…" results with the Save my spot footer |

Typing a bad email in any variant shows the email error. The completion reason appears above the phone frame, with a Reset button.

### App.tsx

- In `handleFlyerJoin`, open the flyer screen instead of the dialog. Flyers that vote "pass" keep the dialog, since the intro card only replays agree or disagree. "super_agree" replays as agree.
- **Render the flyer screen in its own branch, instead of `LobbyScreen`**, like the other full-page screens. The lobby and feed don't mount, so they don't load while the user swipes. When the flow completes, the lobby mounts with `targetRoomId` already set and loads straight into the flyer room.
  - The rooms fetch in `App` also waits until the flow ends, so nothing for the feed loads during it.
  - The cost is a short load after closing, where today the feed is already there. The existing loading spinner covers it.
- The World Cup flyer has retired, so `handleDualStatementFlyerJoin` and the `/final-<team>` routes are gone. (`/final` still opens the room.) The dialog keeps its dual mode for future two-statement flyers, and still handles "pass" flyers and the flag-off path.
- Remove the unused `hasQrScanResult` prop on `LobbyScreen`.

## Tradeoffs

- **Longer path to the email ask.** The dialog asked straight away; now it's after 6 swipes. We expect the tribe reveal to earn a higher conversion rate from those who reach it, but some people will drop out mid-swipe. The tracking below shows exactly where.
- **Votes go in before any email.** Swipes are recorded on the anonymous account, and carry over when they add their email. Users who leave still leave 6 votes, which the dialog never collected.
- **Short load after the flow**, in exchange for not loading an invisible lobby and feed during it.

## Deploy

- Frontend + a small server change (deck order fields), behind a new `FLYER_SWIPE` feature flag. With the flag off, flyers keep the dialog.
- **Ship the server change first.** The client reads `slot` and `name` off the deck order without a fallback.

## Blast radius

**Medium, on the main acquisition funnel.** Every flyer scan goes through it.

- **Flyer conversion** could drop if the swipe flow loses people before the email ask.
- **Stuck screens:** an error, a slow statements fetch, or a room without clusters could leave the user unable to reach the feed. The error boundary and the empty state cover these, and ✕ always works.
- **Double-counted flyer vote** if the container doesn't skip the flyer statement.
- **Deck order endpoint:** two more fields per cluster. It's now only called by flyer scans, not on every room view.
- **Feed swipe stack:** back to its order from before Phase 3 (server order, linked statement first). This is a restore of code that ran in production until Phase 3 shipped.
- **Retention page:** one more calculation over votes it already loads (see below).

The room fetch and vote APIs are unchanged.

## Tracking

### Flow events

Track every step, so we can later chart how users move through the flow. Every event carries the room id, and the anonymous user exists from the scan onwards, so each user's path can be rebuilt in order from `userId` + `createdAt`.

`api.trackEvent` only takes a type and a room id, with no metadata field. The swipe index and vote go in the event type. That's a small, fixed set (6 positions × 4 votes), so it needs no schema change.

| Event | When |
|-------|------|
| `flyer_swipe_opened` | The screen mounts |
| `flyer_swipe_card_{n}_{vote}` | Every swipe, `n` = 1–6, e.g. `flyer_swipe_card_3_disagree`. Card 1 is the flyer replay. |
| `flyer_swipe_results_viewed` | Results screen reached (or the no-clusters empty state) |
| `flyer_results_get_results_clicked` | **Save my spot** (existing name, keeps the conversion numbers comparable) |
| `flyer_swipe_just_looking_clicked` | **Just looking around** |
| `flyer_swipe_closed_{n}` / `flyer_swipe_closed_results` | ✕, with the card it was closed on, or on the results screen |
| `flyer_save_spot_email_submitted` | Email submit button |
| `flyer_save_spot_code_step_shown` | Existing account, so the code step appears |
| `flyer_save_spot_code_submitted` | Code submit button |
| `flyer_save_spot_different_email_clicked` | "Use a different email" |
| `flyer_save_spot_not_now_clicked` | **Not now** |
| `flyer_save_spot_dismissed` | Drawer swiped or tapped away |
| `flyer_results_email_submitted` | Email flow completes (existing name) |

Errors (invalid email, wrong code) get `flyer_save_spot_email_error` and `flyer_save_spot_code_error`.

`trackEvent` is a no-op outside production, so check these with a production build before relying on the chart.

In the feature results tracker: a flyer funnel per week (opened → each card → results → save my spot → email submitted → complete).

### Session length on the retention page

A line chart of median session length per week on the retention page, to see whether the new flow changes it.

**Cheap approximation:** the retention page's `cohort-funnel` endpoint already loads every vote. A session is a user's run of votes with no gap over 15 minutes, which is how the votes-per-session chart already works (`splitIntoSessions`, now in `stats-utils.ts`). Extend it to keep each session's last vote, and length = last vote − first vote. Computing it inside the same endpoint means no extra queries, just one more pass over data already in memory.

Known limits:
- **Votes only.** Time spent reading or posting without voting doesn't count, so the numbers run low. Fine for a trend line.
- **Single-vote sessions are left out.** They'd count as 0 minutes, and there are enough of them (a flyer scan that stops at the dialog, for one) to pin the median at 0.
- **Median, not mean,** so a few very long sessions don't pull the line around.
- **Flyer onboarding nudges it up a little on its own:** 6 swipes is a session of 30–60 seconds, where the dialog gave 1 vote. Expect a small rise from that alone, and read the line with that in mind.

Not chosen: the event-based sessions in `session-utils.ts`. They're more accurate but only cover the last 24 hours, and they'd mean loading every event on a page that's already slow.

---

## Footnotes: code pointers

- URL parsing: `parseFlyerDataFromUrl` in `src/utils/url.tsx`.
- Current flow: `handleFlyerJoin`, `handleQrComplete` and the `QRScanResultDialog` render in `src/App.tsx`. Dialog: `src/components/room/QRScanResultDialog.tsx`.
- Response type: `FlyerVoteResponse` in `src/types/api-responses.ts` depends on `SingleQRScanResult`. Move it into the types file when the dialog is deleted.
- Screen and parts: `src/components/flyer/` (`FlyerSwipeScreen`, `FlyerResults`, `SaveSpotDrawer`). Story: `src/stories/FlyerSwipeScreen.story.tsx`, whose demo is the reference for the container's state. Register any new story in `src/screens/ComponentShowcase.tsx`.
- Email flow: `src/hooks/useEmailOtpFlow.ts`. TOS: `src/components/onboarding/TOSText.tsx`.
- Deck order: `src/supabase/functions/server/deck-order-api.ts`, `buildDeckOrder` in `statement-ordering.ts`. Client type: `DeckOrderCluster` in `src/types/index.ts`. Hook: `src/hooks/useDeckOrder.ts`.
- Cluster identity (`slot`, `naming`): `src/supabase/functions/server/cluster-identity.ts`.
- Estimate and summary: `src/utils/cluster-estimation.ts`, `src/utils/tribe-summary.ts`.
- Event tracking: `trackEvent` in `src/utils/api.tsx`.
- Session length: `medianSessionMinutesByWeek` in `stats-utils.ts` (the session splitting lives there too, and the feature tracker imports it), returned by `cohort-funnel` in `stats-api.tsx`. Card: `src/components/retention/SessionLengthCard.tsx`.
- Feature flag: `src/utils/constants/feature-flags.ts`.
- Existing flyer stats: `features-results-tracker-api.ts` (`flyerResultsClicked`).
