# Hide Response (Moderation) Feature Plan

## Overview

Hosts and moderators can hide individual responses (statements) — e.g. harmful, abusive, or spam content. A hidden response effectively ceases to exist for regular users: it never appears in the voting queue, is excluded from results, and is omitted from every analysis calculation (participation counts, clustering, consensus, highlights, email digests). Hiding is reversible by the host.

Hiding is implemented as a soft flag on the `Statement` record plus a single filter in the shared retrieval path. The underlying votes are preserved, so unhiding restores the statement with all its original data intact.

---

## Assumptions

- Only the room host (and developers) can hide/unhide responses — same permission model as the existing deduplication and vote-matrix moderator tools.
- Hiding can happen at any time — during active voting, between rounds, or after voting has closed. The feature is primarily intended for mid-round moderation of harmful content.
- Votes already cast on a now-hidden statement are retained in the `votes` table but ignored by all aggregation and display paths. If the statement is unhidden, those votes are restored.
- Hiding is a single-statement action. Unlike deduplication, there is no relationship between two statements and no merge graph to manage.
- There is no separate "moderator" role yet — `isHost` is the gate, matching existing conventions in [RoomCardMenu.tsx:121](src/components/room/RoomCardMenu.tsx#L121).

---

## User Flow

### Any user opens the card menu

1. The existing standalone flag icon on `StatementCard` is replaced with a single kebab / three-dot menu button.
2. Tapping it opens a small menu. For all users it contains **"Report"** (the existing flag flow). For hosts, a second item **"Hide response"** is appended.
3. This unifies per-card actions under one affordance and is where we'll hang future per-card actions too.

### Moderator hides a response

1. Host is voting or browsing the room and encounters a harmful response.
2. Host opens the card's menu → taps **"Hide response"**.
3. Confirmation dialog ("This response will no longer appear to users. You can undo this from the moderator tools.") → confirm.
4. Server marks the statement `isHidden = true`.
5. Client refreshes room data. The card disappears from the voting queue and from all results/analysis views for every user, including the host's regular view.

### Moderator reviews and unhides

1. Host opens the three-dot menu on the room card → **"Moderator Tools"** section → **"Hide and Merge Statements"**.
2. A unified modal opens showing all statements in the room. Each row exposes both merge actions (pick source → target) and a per-row **"Hide"** / **"Unhide"** toggle. Hidden statements are visually distinguished (muted, badge) but remain listed so they can be unhidden.
3. Host performs hide, unhide, or merge actions from the same surface.

### Regular user experience

- A hidden response simply isn't there. No tombstone, no "[removed]" placeholder, no vote counts. Users who had previously voted on it will not see it in any history or result.

---

## Data Model

### Changes to `Statement` (server + frontend)

Add three fields to the `Statement` interface in both [src/supabase/functions/server/types.tsx:105-121](src/supabase/functions/server/types.tsx#L105-L121) and [src/types/index.ts:22-37](src/types/index.ts#L22-L37):

| Field | Type | Notes |
|---|---|---|
| `isHidden` | `boolean \| undefined` | Absent/false = visible. Default undefined for existing records — no migration needed. |
| `hiddenAt` | `number \| undefined` | Timestamp when hidden. |
| `hiddenBy` | `string \| undefined` | `userId` of the moderator who hid it. |

No new KV keys, no new tables. The statement itself lives at `statement:{roomId}:{statementId}` and already uses sparse optional fields (e.g. `isSpicy`, `mergedFrom`), so adding these is consistent with the existing shape.

### Why a flag on the statement, not a separate table

Deduplication uses a separate `statement_merges` table because a merge is a relationship between two statements with its own identity and audit trail. Hiding is a unary property of a single statement — it doesn't need its own row. A flag on the record:
- Makes the filter a single predicate (`s => !s.isHidden`) applied once in the shared retrieval layer.
- Avoids an extra fetch-and-join on every `getStatementsForRoom` call (which is already on the hot path — see "Filtering Strategy" below).
- Matches how `isSpicy` and `mergedFrom` are already stored.

If we later need a full moderation audit log (multiple hide/unhide events, per-action notes), we can add an append-only `moderation_events` table without changing this design.

---

## API Endpoints

All endpoints live under the existing `/mod/` prefix established by the deduplication feature, which already carries host-only auth.

- `POST /room/:roomId/mod/statement/:statementId/hide` — sets `isHidden=true`, `hiddenAt=Date.now()`, `hiddenBy=currentUserId`. Returns the updated statement. Host-only.
- `POST /room/:roomId/mod/statement/:statementId/unhide` — clears the three fields. Returns the updated statement. Host-only.
- `GET /room/:roomId/mod/hidden-statements` — returns all hidden statements for the room (used by the "Hidden Responses" modal). Host-only.

Use the existing `defineRoute` wrapper and mirror the structure of the deduplication mod endpoints.

---

## Filtering Strategy

The core design choice: **filter once, at the lowest shared layer, and make it secure by default.** Every code path that fetches statements goes through [getStatementsForRoom](src/supabase/functions/server/kv-utils.tsx#L314) or [getStatementById](src/supabase/functions/server/debate-api.tsx#L52).

### Change `getStatementsForRoom` to filter by default

```ts
// kv-utils.tsx
export const getStatementsForRoom = async (roomId: string): Promise<Statement[]> => {
  const statements = await getByPrefixParsed<Statement>(`statement:${roomId}:`);
  return statements.filter(s => !s.isHidden);
};

// New: moderator-only path that returns everything
export const getAllStatementsForRoomIncludingHidden = async (roomId: string): Promise<Statement[]> => {
  return getByPrefixParsed<Statement>(`statement:${roomId}:`);
};
```

This single change propagates to every caller listed in the codebase map:
- [getStatements in debate-api.tsx:496-535](src/supabase/functions/server/debate-api.tsx#L496-L535) — user-facing room fetch ✓
- [analysis-api.tsx:29](src/supabase/functions/server/analysis-api.tsx#L29) — results & analysis ✓
- [clustering.tsx:440](src/supabase/functions/server/clustering.tsx#L440) — consensus clustering ✓
- [email-digest-data-generator.tsx](src/supabase/functions/server/email-digest-data-generator.tsx) (3 call sites) ✓
- [flyer-api.tsx:83](src/supabase/functions/server/flyer-api.tsx#L83) ✓
- [event-api.tsx:122](src/supabase/functions/server/event-api.tsx#L122) ✓

The only callers that should use the unfiltered variant are:
1. The new `GET /mod/hidden-statements` endpoint.
2. The moderator-facing `DeduplicateModal` data source — if a hidden statement is relevant context for a merge decision, the modal should show it with a "hidden" badge. (Open question — recommend: exclude hidden from dedupe to keep the two features orthogonal.)

### Also filter `getStatementById`

Hidden statements must not be voteable. Currently the vote endpoint ([debate-api.tsx:861-884](src/supabase/functions/server/debate-api.tsx#L861-L884)) fetches by ID. Update `processVote` in [voting-utils.ts:60-150](src/supabase/functions/server/voting-utils.ts#L60) to reject with 404 if `statement.isHidden` — as if the statement doesn't exist, which matches the "cease to exist" framing.

### Votes table — no filtering needed

`calculateVoteStats` operates on votes that belong to a specific statement. If the statement is filtered out upstream, its votes are never aggregated. No change needed to the votes path itself.

---

## What Hiding Affects

| Surface | Effect |
|---|---|
| Voting queue (`SwipeableCard`) | Hidden statements never enter the deck |
| Vote submission | Returns 404 if target is hidden |
| Analysis metrics (`totalParticipants`, `totalVoters`, `totalVotes`) | Hidden statements contribute zero; their votes are not counted |
| Top / spiciest posts | Hidden statements are not candidates |
| Consensus clustering | Hidden statements are not clustered on; their voters still cluster based on their other votes |
| Email digests | Not included in any digest |
| Vote matrix moderator view | Not shown (the matrix is a user-view tool, not a moderation one) |
| Hide and Merge modal (combined moderator tool) | Lists all statements including hidden; hidden rows are muted and cannot be picked as merge source or target, but can be unhidden |

---

## Frontend Changes

### `StatementCard` — replace flag button with a menu

- [src/components/StatementCard.tsx](src/components/StatementCard.tsx) — remove the standalone flag button and replace it with a kebab / three-dot menu button in the same position.
- Menu items:
  - **"Report"** — visible to all users. Triggers the existing flag flow (whatever `onFlag` currently does).
  - **"Hide response"** — visible only when `currentUserId === room.hostId`. Triggers a confirmation dialog, then calls `useDebateSession.hideStatement(roomId, statementId)`.
- After hide, the parent voting flow should advance to the next card as if the user had swiped.
- The menu structure is designed to hold future per-card actions (e.g. pin, star) without further UI churn.

### Moderator menu entry — rename and unify

- [src/components/room/RoomCardMenu.tsx:121-145](src/components/room/RoomCardMenu.tsx#L121-L145) — rename the existing **"Manage Duplicate Statements"** item to **"Hide and Merge Statements"**. Do not add a second entry for hiding; the combined modal covers both actions.
- The "View Vote Matrix" and (developer-only) "Deactivate" items are unchanged.

### Extend `DeduplicateModal` into a combined `HideAndMergeModal`

Rather than ship a second modal, extend the existing [DeduplicateModal](src/components/room/DeduplicateModal.tsx) so a single surface handles both actions. Rename the component file accordingly (`HideAndMergeModal.tsx`) and update its trigger in `RoomCardMenu`.

New responsibilities on top of the current merge UI:
- Fetch all statements including hidden ones (via the new `getAllStatementsForRoomIncludingHidden` path — exposed through a host-only endpoint, e.g. `GET /room/:roomId/mod/statements`).
- Each row shows: text, author, vote counts, current merge state, and a **"Hide"** / **"Unhide"** toggle.
- Hidden rows are visually de-emphasised (muted text, "Hidden" badge showing `hiddenBy` and relative `hiddenAt`) but remain listed so they can be unhidden from the same place.
- Hidden statements should not be selectable as merge source or target — the merge controls on those rows are disabled.
- All three hook methods (`hideStatement`, `unhideStatement`, `listStatementsForModeration`) live in `useDebateSession` alongside the existing merge methods.

This keeps moderation consolidated on one surface and avoids the user flipping between two modals to clean up a round.

### Hook additions

Add to `useDebateSession`:
- `hideStatement(roomId, statementId)`
- `unhideStatement(roomId, statementId)`
- `listStatementsForModeration(roomId)` — returns all statements including hidden ones, for the combined Hide and Merge modal.

Do not call the API directly from components — go through the hook, consistent with the existing convention.

---

## Corner Cases

1. **User mid-swipe on a statement that gets hidden** — the next vote submission fails with 404. Client treats 404-on-vote as "card was withdrawn" and silently advances to the next card without surfacing an error.
2. **Hidden statement referenced by a merge as `target`** — the whole merge group disappears from results (since hiding filters at the source). That's the correct behaviour: hiding a target effectively hides everything merged into it.
3. **Hidden statement referenced by a merge as `source`** — no effect; the merge target remains visible with votes from non-hidden sources. (Worth double-checking in the merge logic to confirm it gracefully handles a missing source.)
4. **Host hides their own statement** — allowed. Useful for a host to self-moderate if they posted something they regret.
5. **User previously voted on a now-hidden statement** — their vote record persists in the votes table but never surfaces anywhere. If the statement is unhidden, the vote is restored automatically (no special logic needed — votes were never deleted).
6. **Host re-hides a previously unhidden statement** — `hiddenAt` and `hiddenBy` are overwritten with the most recent values. This is fine; if we need a full history later we can move to a moderation-events table.
7. **Race: two moderators hide the same statement simultaneously** — last write wins. Both clients get a success response. No correctness impact.
8. **Clustering stability** — when a statement is hidden mid-voting, the next cluster recomputation will exclude it. Existing cached cluster assignments for users remain valid (clustering is based on users' votes across all statements, not on any specific statement).

---

## Testing

- Story in the component showcase for `HiddenStatementsModal`.
- Story for `StatementCard` in host mode showing the hide affordance.
- Unit tests for the filtering behaviour of `getStatementsForRoom` — verify hidden statements are excluded and `getAllStatementsForRoomIncludingHidden` returns them.
- Unit tests for `processVote` rejecting votes on hidden statements.
- Unit test: `calculateAnalysisMetrics` with a mix of visible and hidden statements produces the same result as if hidden ones were never created.
- Unit test: `recalculateClustersForRoom` ignores hidden statements.
- Manual test matrix:
  - Host hides a statement mid-round → other users never see it again in voting or results
  - Host unhides → statement returns with previous vote counts
  - Host hides a statement that has been merged as a target → merged group disappears from results
  - Non-host attempts to call hide endpoint directly → 403

---

## Code Organisation Notes

- Mirror the deduplication feature's structure: mod endpoints live under `/mod/`, hook methods live in `useDebateSession`, and modal UI lives in `src/components/room/`.
- Put the new server-side logic alongside the existing `statement_merges` handlers — likely a new `moderation-api.tsx` that owns the hide/unhide/list endpoints, so it can grow if we add more moderation actions (e.g. hide by keyword, auto-moderation) later.
- Use the `defineRoute` wrapper for new endpoints.
- Do not duplicate the filter — every server-side response read must go through `getStatementsForRoom`/`getStatementById` so the filter is applied in exactly one place.

---

## Implementation Task Breakdown

Tasks are ordered so each one leaves the app in a working, mergeable state. We will ship and review them one PR at a time.

1. ✅ **Types + server filter plumbing.** Add `isHidden` / `hiddenAt` / `hiddenBy` to `Statement` in [server types](src/supabase/functions/server/types.tsx#L105-L121) and [frontend types](src/types/index.ts#L22-L37). Update [getStatementsForRoom](src/supabase/functions/server/kv-utils.tsx#L314) to filter hidden by default; add `getAllStatementsForRoomIncludingHidden`. Make `processVote` in [voting-utils.ts](src/supabase/functions/server/voting-utils.ts#L60) return 404 on hidden statements. Unit tests for both. *No user-visible change — pure plumbing.*

2. ✅ **Moderation API endpoints.** New `moderation-api.tsx` on the server exposing `POST /room/:roomId/mod/statement/:statementId/hide`, `POST .../unhide`, and `GET /room/:roomId/mod/statements` (returns all statements including hidden, for the moderator modal). Host-only auth on all three. Unit tests and a Postman-style smoke test.

3. ✅ **Analysis / clustering / digest coverage tests.** Add unit tests confirming `calculateAnalysisMetrics`, `recalculateClustersForRoom`, and the three email-digest call sites all exclude hidden statements (they should, by virtue of task 1, but we pin it down with tests so it can't regress). Fix any call site that turns out to bypass the shared retrieval helpers.

4. ✅ **`useDebateSession` hook methods.** Add `hideStatement`, `unhideStatement`, `listStatementsForModeration`. Thin wrappers over the endpoints; no UI yet.

5. **`StatementCard` menu refactor.** Replace the standalone flag button with a kebab menu. Menu items: "Report" (all users, wraps existing `onFlag`) and "Hide response" (host-only, opens confirm dialog → calls `hideStatement`). Storybook story covering both regular and host modes.

6. **Combined `HideAndMergeModal`.** Extend [DeduplicateModal](src/components/room/DeduplicateModal.tsx) into a unified modal: rename the component/file, switch its data source to `listStatementsForModeration`, add per-row Hide/Unhide toggle, visually mute hidden rows, disable merge controls on hidden rows. Update [RoomCardMenu.tsx:121-145](src/components/room/RoomCardMenu.tsx#L121-L145) to rename "Manage Duplicate Statements" → "Hide and Merge Statements". Storybook story.

7. **Manual QA and sign-off.** Run through the manual test matrix from the Testing section on a staging room: hide mid-round, unhide, hide a merge target, non-host 403, report still works for non-hosts. Fix any gaps found and close out the feature.
