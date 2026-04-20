# Statement Deduplication Feature Plan

## Overview

Hosts can merge duplicate statements. Rather than modifying existing votes or statements, we store merge mappings in a new table and apply them on the fly whenever analysis or highlights are computed. All underlying data stays untouched.

---

## Assumptions

- The room's voting phase is complete before the host performs any merges. We do not need to handle participants voting on statements that are being merged.

---

## User Flow

1. Host opens three-dot menu on the room card → "Manage Duplicates"
2. Modal opens — all statements with vote counts and current merges
3. Host taps source (the duplicate) → taps target (the canonical statement) → confirms
4. A merge record is created. The source statement is now attributed to the target in all analysis and highlights.
5. Host can delete a merge from the modal to undo it.

---

## Data Model

Add a new Supabase table **`statement_merges`**:

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `roomId` | text | |
| `sourceStatementId` | text | the duplicate being merged away |
| `targetStatementId` | text | the canonical statement to keep |
| `creatorId` | text | |
| `createdAt` | timestamp | |

No changes to existing `statements` or `votes` data.

---

## API Endpoints

- `POST /room/:roomId/mod/statement-merges` — creates a merge. Auth: host/mod only.
- `DELETE /room/:roomId/mod/statement-merges/:mergeId` — deletes the record. Auth: host/mod only.
- `GET /room/:roomId/mod/statement-merges` — returns all merges for the room. Auth: host/mod only.

The entire /mod/ path will be protected with host/mod auth.

---

## On-the-Fly Merge Logic

This logic runs inside any endpoint that computes analysis or highlights (analysis report, room card top-voted result). It does not affect the raw statement list shown in the room feed.

1. Fetch all `statement_merges` for the room
2. Build a map of `sourceStatementId → targetStatementId`
3. When computing vote totals for a statement, collect votes from that statement plus all statements mapped to it as sources
4. Deduplicate by voter: if the same voter (by `userId` or `anonymousUserId`) has votes on more than one statement in the group, count them only once
5. Exclude source statements from display — only the target is shown in results

---

## What Merges Affect

- **Analysis report only** — merged sources are folded into their target; vote counts reflect the deduplicated union. Room card highlights are out of scope for now.

---

## Corner Cases

1. **Voter voted on both S and T** — handled by the dedup step: the voter is counted once regardless of how many statements in the merge group they voted on
2. **Chain merge** (source is already someone else's target) — reject with 400; keep mappings one level deep
3. **Anonymous votes** — dedup checks both `userId` and `anonymousUserId` as the voter key
