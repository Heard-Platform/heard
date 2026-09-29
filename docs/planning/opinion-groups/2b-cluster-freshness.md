# Phase 2b: Keep Clusters Fresh

[← Overview](README.md)

## Problem

Clusters used to be recomputed only when someone opened a room's analysis. Rooms whose analysis nobody opens, such as most flyer rooms, had no clusters or stale ones, so names, sorting (Phase 3) and the minimap (Phase 4) had nothing current to work with.

## Approach

- After each vote, check in the background whether the room's clusters are stale, and recompute if so.
- Stale means both:
  - the room has at least 10% more votes than at the last recompute, **and**
  - the last recompute was at least 5 minutes ago.
- A room that has never been clustered recomputes on its next vote.
- Votes and the analysis page share one check, and each recompute it triggers records a small marker with the vote count and time. Rooms with no participants or no votes are skipped. Manual recomputes from dev tools don't record a marker.
- The 10% rule means the number of recomputes grows with the log of the room's votes: going from 100 to 1,000 votes is about 24 recomputes.
- The analysis page calls the same staleness check instead of recomputing on every new vote. Rooms never clustered, or clustered before this step, have no marker, so they recompute on first view.

## Deploy

- No flag. Each active room recomputes once on its first vote after deploy, then follows the limit.
- Watch the recomputes-per-week chart (Phase 1) for the first week.

## Blast radius

**Small to medium.** It changes when clustering runs across every room, but runs in the background and never slows down a vote.

Areas impacted:
- Voting - Each vote now kicks off a background staleness check (one small read); it can't fail or slow down the vote itself.
- Cluster generation - Runs more often, bounded by the 10% / 5 minute limit; bursts of simultaneous votes can occasionally trigger a duplicate recompute.
- Cluster naming - More recomputes mean more naming activity when auto-naming is on, and group names could change more often if k-means lands on different clusters.
- API endpoint for room analysis report - Now recomputes only when clusters are stale by the shared rule (so the report can be up to ~10% of votes behind).
- DB load - More cluster reads and writes overall.

## Tracking

Covered by Phase 1's chart of cluster recomputes per week and the % of clusters that kept their identity.

---

## Footnotes: code pointers

- `cluster-freshness.ts`: `areClustersStale` (pure staleness rule), `shouldRecomputeClusters` (pure: participants and votes exist, and clusters are stale), and `recomputeClustersIfNeeded(room)`.
- `recalculateClustersForRoom` in `clustering.tsx` only recalculates; its one guard is returning early when a room has no voters.
- Marker at `cluster:${roomId}:recompute` (`{ voteCount, startedAt }`), read/written via `kv-utils.tsx`. `recomputeClustersIfNeeded` writes it before recomputing, using `room.totalVotes`, to narrow the burst window.
- Triggered from `processVote` in `voting-utils.ts` via `runInBackground`, and awaited from `analysis-api.tsx`.
