# Phase 4: Live Minimap

[← Overview](README.md)

## What the user sees

A mini opinion-groups map above the swipe stack, as in the design mockup:
- a coloured circle per cluster, with member dots and the cluster's name
- the user's own dot, which moves between clusters after every vote

## Layout

The map is **schematic, not a 2D projection**:
- Circles sit at fixed anchors by `anchorSlot`: a triangle for k = 3, side by side for k = 2.
- Radius scales with √size, clamped so labels stay readable.
- Member dots: `min(size, 12)` per circle, placed randomly with a seed derived from `stableId`, so they don't jump. No real user data is sent.
- **Skipped: Polis-style PCA.** The server would send 2 principal components and the client would project votes onto them. It's also instant, but k-means clusters often overlap in 2D and look messy at this size. It could come later as the full-size map on the analysis page.

## The user's dot

1. On each swipe, compute the cluster estimate from the Phase 3 snapshot. It's instant, with no network call.
2. The target position is `Σ posterior[c] · anchor[c]`.
   - A clear winner puts the dot inside that circle.
   - A near-tie puts it between circles ("on the fence").
3. Spring-animate the dot there.
4. With < 3 votes, keep it at the centre with "Keep swiping to find your group".
5. When the dot enters a new circle, briefly highlight that circle's name.

## Why "imperfect" is fine

- The snapshot is slightly out of date during a session, but one user's votes barely move the clusters.
- The naive Bayes estimate can occasionally disagree with the server's k-means assignment. When the user finishes swiping, fetch their real `stableId` and ease the dot there if it's different.
- If the snapshot `version` changed during the session, refetch it at the same moment, never mid-swipe.

## Empty state

With fewer than 2 clusters, show "Opinion groups forming…" instead of the map.

## Deploy

- Frontend only (Phase 3 already ships the data), behind a feature flag.

## Tracking

In the feature results tracker: a chart of flyer-user conversion rate (% who create an account) per week.

---

## Footnotes: code pointers

- Mount point: `src/components/flyer/FlyerSwipeScreen.tsx`. Story: `src/stories/FlyerSwipeScreen.story.tsx`.
- New `ClusterMinimap` component, presentational. Props: snapshot and posterior, with callbacks last per repo convention.
- New `useClusterPosition(snapshot, userVotes)` hook wrapping `estimateClusterPosterior` from `src/utils/cluster-estimation.ts`.
- The swipe stack already uses `motion`, so use it for the spring animation.
- Real assignment for reconciliation: from the analysis endpoint, or a small new `GET /room/:roomId/my-cluster`.
- Stories to cover: k = 2, k = 3, no clusters, mid-transition, longest names.
- Feature flag: `src/utils/constants/feature-flags.ts`.
