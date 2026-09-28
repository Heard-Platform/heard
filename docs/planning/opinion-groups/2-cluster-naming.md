# Phase 2: Cluster Naming

[← Overview](README.md)

## Name rules

- 2–3 words, **≤ 16 characters**, aiming for 14–16. Examples: "Full Speed Ahead", "Hit the Brakes", "Show Me the Data".
- Describes what the group *believes*, not who its members are.
- Fair: every group should be happy with its name. No mocking, no partisan labels, no real people's names.

## Fallback names

Used before a cluster is named, or when naming fails. They must not imply a stance.

- **Recommended: colour teams** ("Team Violet", "Team Teal", "Team Amber"), assigned by map slot. They match the dot colours, and they stay consistent after the real name arrives.
- Rejected: animals (arbitrary) and Greek letters (imply a ranking).

## When to generate

Don't call the LLM on every recompute. A cluster needs a name only when:
1. it's new (`needsName` from Phase 1), **or**
2. its top 3 distinguishing statements have drifted: 2 of the 3 changed. That set is stored as the cluster's `nameInputSignature`.

Small shifts don't trigger a rename, because a user's group suddenly getting a new name is jarring.

**Minimum data:** ≥ 5 members and ≥ 1 statement that clears the z-test. Until then, the cluster keeps its fallback.

## Prompt

- All clusters are named in **one call**, so the names contrast with each other.
- For each cluster, the model sees:
  - its size
  - its top ~5 distinguishing statements in **both** directions ("agrees much more than others" and "disagrees much more than others")
  - its current name, if any, with an instruction to keep it unless it no longer fits
- Room context: the post title and 1–2 statements every cluster agrees on, as "not what separates them".
- Output: JSON `{ names: [{ stableId, name }] }`.

Today's distinguishing-statement z-test only keeps the agree-more side. Add a two-sided variant for naming and leave the existing one alone, because the report depends on it.

## Validation and execution

- On the server:
  - Parse the JSON.
  - Every cluster must be present.
  - Check word count and the 16-character cap.
  - Reject duplicates.
  - Run the names through moderation.
- Retry once with the specific failure noted. If it fails again, keep the fallback, log it, and try again on the next recompute.
- Runs in the background (`EdgeRuntime.waitUntil`) after a recompute, so no request waits on the LLM.
- Only writes back if the identity record's `version` hasn't changed since naming started.
- Uses the existing LLM client, so usage logging comes for free. Haiku-class models are enough. Cost: about 1–2k input tokens per call, only when clusters change.

## Where names appear

- First on the analysis report, replacing the Group A/B/C letters. It's the cheapest place to judge real-world quality.
- Then on the minimap (Phase 4).

## Deploy

- Server behind an internal on/off switch. Turn it on for a few rooms, review the names, then leave it on.
- The frontend shows the name if one exists and the fallback otherwise, so the two sides can deploy in either order.

## Later

- A moderator "regenerate names" action, which clears the name and re-flags `needsName`.

## Tracking

In the feature results tracker: a list of every room with named clusters, showing each cluster's name and size, for spot-checking name quality. Plus a count of clusters where naming failed.

---

## Footnotes: code pointers

- LLM: `createLlmClient().completeJson(prompt, { endpoint: "cluster-naming" })` in `src/supabase/functions/server/llm-provider.ts`.
- `calcDistinguishingStatements` in `cluster-analysis.tsx` filters to z ≥ 1.96. Add a sibling that filters on `|z| ≥ 1.96` and keeps the sign.
- New module `cluster-naming.ts` containing:
  - a pure prompt builder
  - a pure validator
  - drift detection
  - `nameClustersForRoom(roomId)`
- Trigger it at the end of `clusterUsersAndSave` in `clustering.tsx`.
- On/off switch: follow the `ENRICHMENT_ON` pattern in `internal-config-api.tsx` / `internal-utils.ts` (e.g. `CLUSTER_NAMING_ON`).
- Moderation: reuse `moderation-utils.ts`.
- Expose it as `clusterConsensus.clusters[].name` via `analysis-api.tsx`.
- Tracking: read the identity records by KV prefix and keep only the `:identity` keys (the `cluster:` prefix also matches metadata). Log a `cluster_naming_run` event via `insertAnalyticsEvent`. Build the spot-check list as a new `devtools/feature-tracker/ClusterNamesList.tsx`, rendered via `renderExtra` on a `FeatureResultsTracker.tsx` entry.
