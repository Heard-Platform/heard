# Opinion Groups

## Goal

Help participants understand a post's opinion landscape at a glance, and see where they fit in it while they vote.

## Phases

Each phase ships and deploys on its own, in this order. Each one also adds a quick health check to the feature results tracker (see its Tracking section).

| # | Phase | What users get | Deploy gate |
|---|-------|----------------|-------------|
| 1 | [Cluster stabilization](1-cluster-stabilization.md) | Nothing visible. Clusters keep their identity across recomputes. | None |
| 2 | [Cluster naming](2-cluster-naming.md) | Fun, 14–16 char group names on the analysis report, plus a new AI Review tab in dev tools | Server switch |
| 2b | [Keep clusters fresh](2b-cluster-freshness.md) | Nothing visible. Clusters recompute as votes come in, not only when the analysis is opened. | None |
| 3 | [Cluster-aware sorting](3-cluster-aware-sorting.md) | First cards are the ones that best place you in a group | Feature flag |
| 4 | [Live minimap](4-live-minimap.md) | Your dot moves between groups as you swipe | Feature flag |
| 5 | [Flyer integration](5-flyer-integration.md) | Flyer scans open the swipe screen in place of the results dialog, then drop into the feed on the flyer room | Feature flag |

## Key decisions

- **Stability comes first.** Cluster numbers currently change between recomputes. Names, colours and map positions all need an identity that persists.
- **The LLM names clusters only when they meaningfully change,** in a single call so the names contrast with each other. It runs in the background, so no request waits on it.
- **Fallback names are plain "Group A/B/C"**, lettered by slot so they stay stable across recomputes.
- **One client-side model drives both sorting and the minimap.** The server sends a small deck order once per room: the opening cards plus each cluster's agree/disagree/pass rates per statement, with no user data. The browser uses it to estimate the user's group instantly on every swipe.
- **The minimap is schematic, not a true 2D projection.** It is clearer at small sizes and matches the mockup.

## Risks

- **Opening with the most divisive statements** may feel combative. Mitigated by a consensus card in slot 3 of the opening cards. Watch completion rates.
- **Name churn:** the LLM could reword a name without the group changing. Rename only when the group's stance has actually drifted, and the model defaults to keeping the name and must say what changed.
- **The client estimate can disagree with the server's official assignment.** Reconcile when the user finishes swiping.

## Open questions

1. Freeze names once a room ends? *Suggest yes.*
2. What overlap threshold counts as "the same cluster"? *Decide from Phase 1 logs; starting at 40%.*
