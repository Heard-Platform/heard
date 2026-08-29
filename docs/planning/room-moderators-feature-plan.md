# Room Moderators Feature Plan

## Overview

A room host can grant other users **moderator** status. Moderators get the same in-room moderation controls the host has today (hide responses, merge duplicates, view vote matrix, future moderator-only tools), but cannot manage moderators themselves or end the room. The host remains the single owner; moderators are a delegation layer beneath them.

This is intentionally a small surface — it is a permission change, not a new feature area. Most of the work is in the invite UX.

---

## Open questions for review

Before writing detailed design, please weigh in on these — they drive the rest of the doc:

1. **Invite mechanism — link, in-app pick, or both?** Three plausible options below ([Invite flow](#invite-flow)). Recommended: **shareable link** as the primary path. It's how the room itself is shared, it works for users not yet in the room, and it side-steps any "search for a user" UI we'd otherwise have to build.
2. **Can moderators promote other moderators, or host-only?** Recommended: **host-only**. Keeps the trust model simple and matches "the host owns the room." Easy to relax later.
3. **Cap on moderators per room?** Recommended: soft cap (e.g. 5) shown as a hint in the UI, no hard server limit yet.
4. **Should the moderator list be public to participants, or private to the host?** Recommended: **private to the host and the moderators themselves.** Regular participants don't see who's moderating. Reduces social friction around demotion.

---

## User flow (frontend)

### Host opens "Manage Moderators"

1. Host opens the room card's three-dot menu → **Moderator Tools** section → new entry **"Manage Moderators"**. Lives next to "Hide and Merge Statements" in [RoomCardMenu.tsx:121-145](src/components/room/RoomCardMenu.tsx#L121-L145).
2. Modal opens (`ManageModeratorsModal`) with two sections:
   - **Current moderators** — list of users with display name, avatar, "Demote" button. The host appears at the top with a non-removable "Host" badge.
   - **Invite a moderator** — primary CTA: **"Copy moderator invite link"**. Below it, a short helper line: *"Anyone with this link who signs in becomes a moderator of this room."*
3. That's the whole surface. No user search, no email entry, no notification system.

### Sharing the invite

The host taps **"Copy moderator invite link"** → uses the existing `share()` helper (the same one [RoomCardMenu.tsx:62-82](src/components/room/RoomCardMenu.tsx#L62-L82) uses for the room share link), so on mobile it opens the native share sheet (iMessage, WhatsApp, etc.) and on desktop it copies to clipboard with a toast.

The link looks like:

```
https://heard.app/r/:roomId/mod-invite/:token
```

- `:token` is a random opaque string stored on the server, scoped to the room, with an expiry (default: 7 days) and an optional one-time-use flag.
- The host can rotate / revoke the active token from the same modal ("Revoke link" → generates a new one).

### Recipient accepts the invite

1. User taps the link.
2. If signed out → standard auth flow, then redirect back to the invite URL.
3. If signed in → `mod-invite` route resolves the token server-side, marks the user as a moderator, and redirects them into the room with a one-time toast: *"You're now a moderator of this room."*
4. If the token is expired/revoked → friendly error page with "Ask the host for a new link."

The recipient does not need to have joined the room beforehand — accepting the invite makes them a participant *and* a moderator in one step. This matches how the existing room share link works for first-time joiners.

### Why a link instead of an in-app picker

- The host often wants to delegate to someone who isn't in the room yet (a co-organiser, another community admin). A picker would force them to wait until that person joins.
- We already have a strong "share this link" muscle memory in this app. Reusing it keeps the mental model consistent.
- We avoid building a user-search UI, which is the heaviest lift in the picker version.
- Trade-off: links can be forwarded. Mitigation: token has expiry, host can revoke, and (optionally) one-time-use flag means only the first redeemer becomes a mod. We can add a confirmation step on accept if forwarding turns out to be a problem in practice.

### Demoting a moderator

From the same modal, host taps the row's "Demote" button → confirmation dialog → server clears that user from the moderator list. The demoted user remains a participant; only their elevated permissions go away. No notification is sent.

### Moderator's view

A moderator sees the same moderator-tools section in the room card menu that the host sees today, minus the "Manage Moderators" entry. They cannot demote themselves from the UI (they can leave the room, but that doesn't strip the role — open question whether to auto-strip on leave; default: yes).

---

## Data model

### `DebateRoom` change

Add one field to [DebateRoom](src/types/index.ts#L194-L220) and the matching server type:

| Field | Type | Notes |
|---|---|---|
| `moderatorIds` | `string[] \| undefined` | userIds of moderators. `undefined`/`[]` = host-only. Host's own id is **not** included — host is always implicitly authorised. |

### Moderator-invite token (new)

A small KV record per active invite link:

```
mod-invite:{roomId}:{token} → { roomId, createdBy, createdAt, expiresAt, oneTimeUse, redeemedBy? }
```

One active token per room at a time. Generating a new one supersedes the previous (which is deleted). No new database table needed.

---

## Permission model

Today, every host-gated check in the app is a direct comparison: `currentUserId === room.hostId`. We replace the moderation-surface checks with a single helper:

```ts
// src/utils/permissions.ts (new) — and a server-side mirror
export const isRoomModerator = (userId: string, room: DebateRoom): boolean =>
  userId === room.hostId || (room.moderatorIds ?? []).includes(userId);
```

Rules:
- All existing `/mod/*` server endpoints (deduplication, hide/unhide, vote-matrix data, future moderator endpoints) gate on `isRoomModerator` instead of host-only.
- The new `/mod/moderators/*` endpoints gate on **host-only** (only the host can promote/demote/rotate links).
- The frontend `isHost` flag passed into [RoomCardMenu](src/components/room/RoomCardMenu.tsx) becomes `canModerate` (computed via `isRoomModerator`). The "Manage Moderators" entry inside the moderator section uses the stricter `isHost` check.

This is a search-and-replace exercise across a small, known set of call sites — every existing host-only moderation gate. Nothing changes for non-moderation host-only behaviour (e.g. ending a room, editing the topic).

---

## API endpoints

All host-only, all under the existing `/mod/` prefix:

- `POST /room/:roomId/mod/moderators/invite` — generate (or rotate) the moderator invite token. Returns `{ token, expiresAt }`.
- `DELETE /room/:roomId/mod/moderators/invite` — revoke the active token.
- `POST /room/:roomId/mod/moderators/accept/:token` — called by the recipient. Adds them to `moderatorIds`. Auth: any signed-in user holding a valid token.
- `DELETE /room/:roomId/mod/moderators/:userId` — demote.
- `GET /room/:roomId/mod/moderators` — list current moderators (with display info) for the modal.

---

## Frontend changes

- New modal: `src/components/room/ManageModeratorsModal.tsx`.
- New route: `/r/:roomId/mod-invite/:token` → calls `acceptModeratorInvite` hook method, then redirects into the room.
- Hook additions on `useDebateSession` (or a sibling `useRoomModerators` hook if it grows): `listModerators`, `generateModeratorInvite`, `revokeModeratorInvite`, `acceptModeratorInvite`, `demoteModerator`.
- [RoomCardMenu.tsx](src/components/room/RoomCardMenu.tsx) — add "Manage Moderators" entry (host-only) inside the existing Moderator Tools section. Replace the `isHost` prop with a `canModerate` prop where appropriate; keep `isHost` for the Manage Moderators entry itself.
- All call sites that compute `isHost` for menu-gating purposes are updated to use the new `canModerate` helper. (Quick audit needed — likely a single-digit number of files.)

---

## Corner cases (to flesh out after design review)

- Host transfers ownership → existing flow, if any. Moderator list carries over.
- Host demotes themselves → not possible; host is not in `moderatorIds`.
- User accepts an invite for a room they've been kicked from → reject.
- Two users redeem a one-time invite simultaneously → first write wins, second gets a friendly "link already used" error.
- Moderator deletes their account → they're filtered out of `moderatorIds` by the same path that handles deleted-user cleanup elsewhere.

---

## Implementation order (rough)

1. **Permission helper + server gate refactor.** Introduce `isRoomModerator`, swap it into existing `/mod/*` gates. No user-visible change. Tests pin the host-still-works behaviour.
2. **Data model + moderator API endpoints.** Add `moderatorIds`, the invite-token KV, and the five endpoints above. Server tests only.
3. **Hook methods.** Thin wrappers; no UI.
4. **`ManageModeratorsModal` + menu entry.** Storybook stories for empty / populated / over-soft-cap states.
5. **Invite-accept route.** New page, redirect handling, signed-out → auth → resume.
6. **Manual QA matrix.** Host invites mod via link, mod sees moderator tools, mod hides a response, host demotes, demoted user loses tools, expired link, revoked link, one-time link redeemed twice.
