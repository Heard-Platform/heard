import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ClusterIdentityRecord,
  jaccardOverlap,
  resolveClusterIdentities,
} from "./cluster-identity.ts";

function sequentialIds(): () => string {
  let n = 0;
  return () => `new-${n++}`;
}

function memberships(groups: string[][]): { userId: string; clusterId: number }[] {
  return groups.flatMap((ids, clusterId) => ids.map((userId) => ({ userId, clusterId })));
}

function users(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}`);
}

function previousRecord(groups: { stableId: string; slot: number; memberIds: string[] }[]): ClusterIdentityRecord {
  return {
    version: 3,
    timestamp: 0,
    clusters: groups.map((g, clusterIndex) => ({ ...g, clusterIndex })),
  };
}

Deno.test("jaccardOverlap - identical sets overlap fully", () => {
  assertEquals(jaccardOverlap(new Set(["a", "b"]), new Set(["a", "b"])), 1);
});

Deno.test("jaccardOverlap - disjoint and empty sets overlap zero", () => {
  assertEquals(jaccardOverlap(new Set(["a"]), new Set(["b"])), 0);
  assertEquals(jaccardOverlap(new Set(), new Set()), 0);
});

Deno.test("resolveClusterIdentities - first run assigns fresh ids and sequential slots", () => {
  const result = resolveClusterIdentities(
    null,
    memberships([users("a", 3), users("b", 3)]),
    2,
    100,
    sequentialIds(),
  );

  assertEquals(result.record.version, 1);
  assertEquals(result.record.timestamp, 100);
  assertEquals(result.record.clusters.map((c) => c.stableId), ["new-0", "new-1"]);
  assertEquals(result.record.clusters.map((c) => c.slot), [0, 1]);
  assertEquals(result.keptCount, 0);
  assertEquals(result.newCount, 2);
});

Deno.test("resolveClusterIdentities - first run hands out slots largest cluster first", () => {
  const result = resolveClusterIdentities(
    null,
    memberships([users("a", 2), users("b", 5), users("c", 3)]),
    3,
    0,
    sequentialIds(),
  );

  assertEquals(result.record.clusters.map((c) => c.slot), [2, 0, 1]);
});

Deno.test("resolveClusterIdentities - identical membership keeps ids and slots", () => {
  const previous = previousRecord([
    { stableId: "x", slot: 0, memberIds: users("a", 5) },
    { stableId: "y", slot: 1, memberIds: users("b", 5) },
  ]);

  const result = resolveClusterIdentities(
    previous,
    memberships([users("a", 5), users("b", 5)]),
    2,
    200,
    sequentialIds(),
  );

  assertEquals(result.record.version, 4);
  assertEquals(result.record.clusters.map((c) => c.stableId), ["x", "y"]);
  assertEquals(result.record.clusters.map((c) => c.slot), [0, 1]);
  assertEquals(result.keptCount, 2);
  assertEquals(result.newCount, 0);
});

Deno.test("resolveClusterIdentities - permuted cluster indices keep ids with their members", () => {
  const previous = previousRecord([
    { stableId: "x", slot: 0, memberIds: users("a", 5) },
    { stableId: "y", slot: 1, memberIds: users("b", 5) },
    { stableId: "z", slot: 2, memberIds: users("c", 5) },
  ]);

  const result = resolveClusterIdentities(
    previous,
    memberships([users("c", 5), users("a", 5), users("b", 5)]),
    3,
    0,
    sequentialIds(),
  );

  assertEquals(result.record.clusters.map((c) => c.stableId), ["z", "x", "y"]);
  assertEquals(result.record.clusters.map((c) => c.slot), [2, 0, 1]);
  assertEquals(result.record.clusters.map((c) => c.clusterIndex), [0, 1, 2]);
});

Deno.test("resolveClusterIdentities - small membership drift still keeps ids", () => {
  const previous = previousRecord([
    { stableId: "x", slot: 0, memberIds: users("a", 10) },
    { stableId: "y", slot: 1, memberIds: users("b", 10) },
  ]);

  const driftedA = [...users("a", 9), "b9", "newcomer"];
  const driftedB = [...users("b", 9), "a9"];

  const result = resolveClusterIdentities(
    previous,
    memberships([driftedA, driftedB]),
    2,
    0,
    sequentialIds(),
  );

  assertEquals(result.record.clusters.map((c) => c.stableId), ["x", "y"]);
});

Deno.test("resolveClusterIdentities - split cluster: larger side inherits, other side is new", () => {
  const previous = previousRecord([
    { stableId: "x", slot: 0, memberIds: users("a", 10) },
    { stableId: "y", slot: 1, memberIds: users("b", 10) },
  ]);

  const bigHalf = users("a", 10).slice(0, 7);
  const smallHalf = users("a", 10).slice(7);

  const result = resolveClusterIdentities(
    previous,
    memberships([bigHalf, smallHalf, users("b", 10)]),
    3,
    0,
    sequentialIds(),
  );

  assertEquals(result.record.clusters.map((c) => c.stableId), ["x", "new-0", "y"]);
  assertEquals(result.record.clusters.map((c) => c.slot), [0, 2, 1]);
  assertEquals(result.keptCount, 2);
  assertEquals(result.newCount, 1);
});

Deno.test("resolveClusterIdentities - k dropping from 3 to 2 drops one identity", () => {
  const previous = previousRecord([
    { stableId: "x", slot: 0, memberIds: users("a", 5) },
    { stableId: "y", slot: 1, memberIds: users("b", 5) },
    { stableId: "z", slot: 2, memberIds: users("c", 2) },
  ]);

  const result = resolveClusterIdentities(
    previous,
    memberships([users("a", 5), [...users("b", 5), ...users("c", 2)]]),
    2,
    0,
    sequentialIds(),
  );

  assertEquals(result.record.clusters.map((c) => c.stableId), ["x", "y"]);
  assertEquals(result.record.clusters.length, 2);
});

Deno.test("resolveClusterIdentities - overlap below threshold creates a new identity", () => {
  const previous = previousRecord([
    { stableId: "x", slot: 0, memberIds: users("a", 10) },
  ]);

  const mostlyNew = [...users("a", 3), ...users("n", 7)];

  const result = resolveClusterIdentities(
    previous,
    memberships([mostlyNew]),
    1,
    0,
    sequentialIds(),
  );

  assertEquals(result.record.clusters[0].stableId, "new-0");
  assertEquals(result.record.clusters[0].slot, 0);
});

Deno.test("resolveClusterIdentities - new clusters take the lowest slot not held by a kept cluster", () => {
  const previous = previousRecord([
    { stableId: "x", slot: 0, memberIds: users("a", 5) },
    { stableId: "z", slot: 2, memberIds: users("c", 5) },
  ]);

  const result = resolveClusterIdentities(
    previous,
    memberships([users("c", 5), users("n", 5)]),
    2,
    0,
    sequentialIds(),
  );

  assertEquals(result.record.clusters.map((c) => c.stableId), ["z", "new-0"]);
  assertEquals(result.record.clusters.map((c) => c.slot), [2, 0]);
});
