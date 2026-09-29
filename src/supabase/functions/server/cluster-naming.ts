import { AiPrompt, InternalVarKey, VoteType } from "./types.tsx";
import {
  getClusterIdentityRecord,
  getDebate,
  getStatementsForRoom,
  getVotesForStatement,
  saveClusterIdentityRecord,
} from "./kv-utils.tsx";
import { getInternalVar, setInternalVar } from "./model-utils.ts";
import { createLlmClient } from "./llm-provider.ts";
import { ClusterIdentity, ClusterNaming } from "./cluster-identity.ts";
import {
  buildNamingInputs,
  ClusterNamingInput,
  findCommonGround,
  hasStanceDrifted,
  isEligibleForNaming,
  makeClusterNamingPrompt,
  makeClusterRenamePrompt,
  NamingStatement,
  parseClusterNamingResponse,
  parseClusterRenameResponse,
  ParseResult,
  RenameDecision,
  toStanceSnapshot,
  withRetryNote,
} from "./cluster-naming-utils.ts";

export const CLUSTER_NAMING_ENDPOINT = "cluster-naming";
export const MANUAL_RERUN_REASON = "Manual re-run";
export const MAX_NAMING_RETRIES = 2;

export type ClusterNamingMode = "auto" | "force";

export async function isClusterNamingEnabled(): Promise<boolean> {
  return (await getInternalVar<boolean>(InternalVarKey.CLUSTER_NAMING_ON)) ?? false;
}

export async function setClusterNamingEnabled(enabled: boolean): Promise<void> {
  await setInternalVar(InternalVarKey.CLUSTER_NAMING_ON, enabled);
}

async function loadStatementsWithVoters(roomId: string): Promise<NamingStatement[]> {
  const statements = await getStatementsForRoom(roomId);
  return Promise.all(
    statements.map(async (statement) => {
      const votes = await getVotesForStatement(statement.id);
      const voters: Record<string, VoteType> = {};
      for (const vote of votes) voters[vote.userId] = vote.voteType;
      return { id: statement.id, text: statement.text, voters };
    }),
  );
}

async function completeWithRetry<T>(
  prompt: AiPrompt,
  parse: (raw: string) => ParseResult<T>,
): Promise<T | null> {
  const client = createLlmClient();
  let currentPrompt = prompt;
  for (let attempt = 0; attempt <= MAX_NAMING_RETRIES; attempt++) {
    const raw = await client.completeJson(currentPrompt, { endpoint: CLUSTER_NAMING_ENDPOINT });
    const result = parse(raw);
    if (result.ok) return result.value;
    console.warn(`[ClusterNaming] Rejected LLM response (attempt ${attempt + 1}): ${result.error}`);
    currentPrompt = withRetryNote(prompt, result.error);
  }
  return null;
}

function requestNames(
  topic: string,
  clusters: ClusterNamingInput[],
  takenNames: string[],
  commonGround: string[],
): Promise<string[] | null> {
  const prompt = makeClusterNamingPrompt(topic, clusters, takenNames, commonGround);
  return completeWithRetry(prompt, (raw) =>
    parseClusterNamingResponse(raw, clusters.length, takenNames),
  );
}

async function assignFreshNames(
  topic: string,
  clusters: ClusterNamingInput[],
  takenNames: string[],
  commonGround: string[],
  existing: Map<string, ClusterNaming | null>,
  renameReason: string | null,
  now: number,
): Promise<Map<string, ClusterNaming> | null> {
  if (clusters.length === 0) return new Map();
  const names = await requestNames(topic, clusters, takenNames, commonGround);
  if (!names) return null;

  return new Map(
    clusters.map((cluster, i) => {
      const previousName = existing.get(cluster.stableId)?.name ?? null;
      return [
        cluster.stableId,
        {
          name: names[i],
          namedAt: now,
          stanceSnapshot: toStanceSnapshot(cluster),
          previousName,
          renameReason: previousName ? renameReason : null,
        },
      ];
    }),
  );
}

async function resolveDriftedName(
  topic: string,
  identity: ClusterIdentity,
  naming: ClusterNaming,
  input: ClusterNamingInput,
  statements: NamingStatement[],
  takenNames: string[],
  commonGround: string[],
  now: number,
): Promise<ClusterNaming | null> {
  const prompt = makeClusterRenamePrompt(
    topic,
    naming.name,
    naming.stanceSnapshot,
    input,
    statements,
    takenNames,
    commonGround,
  );
  const decision: RenameDecision | null = await completeWithRetry(prompt, (raw) =>
    parseClusterRenameResponse(raw, takenNames),
  );

  if (!decision || decision.decision === "keep") return null;

  console.log(
    `[ClusterNaming] Renaming cluster ${identity.stableId} "${naming.name}" -> "${decision.name}": ${decision.reason}`,
  );
  return {
    name: decision.name,
    namedAt: now,
    stanceSnapshot: toStanceSnapshot(input),
    previousName: naming.name,
    renameReason: decision.reason,
  };
}

async function planForcedNaming(
  topic: string,
  identities: ClusterIdentity[],
  inputs: ClusterNamingInput[],
  commonGround: string[],
  now: number,
): Promise<Map<string, ClusterNaming | null>> {
  const existing = new Map(identities.map((c) => [c.stableId, c.naming]));
  const eligible = inputs.filter(isEligibleForNaming);
  const named = await assignFreshNames(topic, eligible, [], commonGround, existing, MANUAL_RERUN_REASON, now);
  if (!named) throw new Error(`Cluster naming failed validation after ${MAX_NAMING_RETRIES} retries`);

  return new Map(inputs.map((input) => [input.stableId, named.get(input.stableId) ?? null]));
}

async function planAutomaticNaming(
  topic: string,
  identities: ClusterIdentity[],
  inputs: ClusterNamingInput[],
  statements: NamingStatement[],
  commonGround: string[],
  now: number,
): Promise<Map<string, ClusterNaming | null>> {
  const updates = new Map<string, ClusterNaming | null>();
  const inputById = new Map(inputs.map((i) => [i.stableId, i]));
  const currentNames = new Map(
    identities.filter((c) => c.naming).map((c) => [c.stableId, c.naming!.name]),
  );

  const unnamed = inputs.filter(
    (input) => !currentNames.has(input.stableId) && isEligibleForNaming(input),
  );
  const fresh = await assignFreshNames(
    topic,
    unnamed,
    [...currentNames.values()],
    commonGround,
    new Map(),
    null,
    now,
  );
  for (const [stableId, naming] of fresh ?? []) {
    updates.set(stableId, naming);
    currentNames.set(stableId, naming.name);
  }

  for (const identity of identities) {
    const naming = identity.naming;
    const input = inputById.get(identity.stableId);
    if (!naming || !input || !isEligibleForNaming(input)) continue;
    if (!hasStanceDrifted(naming.stanceSnapshot, identity.memberIds, statements)) continue;

    const takenNames = [...currentNames]
      .filter(([stableId]) => stableId !== identity.stableId)
      .map(([, name]) => name);
    const renamed = await resolveDriftedName(
      topic,
      identity,
      naming,
      input,
      statements,
      takenNames,
      commonGround,
      now,
    );
    if (renamed) {
      updates.set(identity.stableId, renamed);
      currentNames.set(identity.stableId, renamed.name);
    }
  }

  return updates;
}

export async function nameClustersForRoom(
  roomId: string,
  mode: ClusterNamingMode,
): Promise<void> {
  const identity = await getClusterIdentityRecord(roomId);
  const room = await getDebate(roomId);
  if (!identity || !room) return;

  const statements = await loadStatementsWithVoters(roomId);
  const identities = identity.clusters.map((c) => ({ ...c, naming: c.naming ?? null }));
  const inputs = buildNamingInputs(identities, statements);
  const commonGround = findCommonGround(identities, statements);
  const now = Date.now();

  const updates = mode === "force"
    ? await planForcedNaming(room.topic, identities, inputs, commonGround, now)
    : await planAutomaticNaming(room.topic, identities, inputs, statements, commonGround, now);

  if (updates.size === 0) return;

  const latest = await getClusterIdentityRecord(roomId);
  if (!latest || latest.version !== identity.version) {
    console.log(`[ClusterNaming] Clusters for room ${roomId} changed while naming; discarding names`);
    return;
  }

  await saveClusterIdentityRecord(roomId, {
    ...latest,
    clusters: latest.clusters.map((c) =>
      updates.has(c.stableId) ? { ...c, naming: updates.get(c.stableId) ?? null } : c,
    ),
  });
  console.log(`[ClusterNaming] Saved ${updates.size} cluster name update(s) for room ${roomId}`);
}
