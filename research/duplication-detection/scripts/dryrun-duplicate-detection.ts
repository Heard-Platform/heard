// @ts-nocheck — Deno script; not type-checked by the project tsc.
/// <reference lib="deno.ns" />
import Papa from "npm:papaparse@5.5.3";

const STATEMENTS_PATH = "public/data/statements.csv";
const EMBEDDINGS_PATH = "public/data/statement-embeddings.csv";
const OUTPUT_PATH = "public/data/dryrun-merges.csv";

const SUMMARY_THRESHOLDS = [0.70, 0.75, 0.80, 0.85, 0.90, 0.95];

type StatementRow = {
  room_id: string;
  topic: string;
  statement_id: string;
  statement_text: string;
  timestamp: string;
};

type EmbeddingRow = {
  statement_id: string;
  embedding_json: string;
};

type MergeRow = {
  room_id: string;
  topic: string;
  duplicate_statement_id: string;
  duplicate_text: string;
  duplicate_timestamp: number;
  target_statement_id: string;
  target_text: string;
  target_timestamp: number;
  similarity: number;
  target_was_already_duplicate: boolean;
};

async function readCsv<T extends Record<string, string>>(
  path: string,
): Promise<T[]> {
  const text = await Deno.readTextFile(path);
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return parsed.data.filter(
    (r: Record<string, string>) => r && Object.keys(r).length > 0,
  );
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

type EnrichedStatement = StatementRow & { timestampNum: number; embedding: number[] };

function simulate(
  threshold: number,
  byRoom: Map<string, EnrichedStatement[]>,
): MergeRow[] {
  const merges: MergeRow[] = [];
  for (const roomStatements of byRoom.values()) {
    const ordered = [...roomStatements].sort(
      (a, b) => a.timestampNum - b.timestampNum,
    );
    const mergedIntoId = new Map<string, string>();
    for (let i = 0; i < ordered.length; i++) {
      const s = ordered[i];
      let bestScore = -1;
      let bestTarget: EnrichedStatement | null = null;
      for (let j = 0; j < i; j++) {
        const candidate = ordered[j];
        if (mergedIntoId.has(candidate.statement_id)) continue;
        const score = cosine(s.embedding, candidate.embedding);
        if (score > bestScore) {
          bestScore = score;
          bestTarget = candidate;
        }
      }
      if (bestTarget && bestScore >= threshold) {
        mergedIntoId.set(s.statement_id, bestTarget.statement_id);
        merges.push({
          room_id: s.room_id,
          topic: s.topic,
          duplicate_statement_id: s.statement_id,
          duplicate_text: s.statement_text,
          duplicate_timestamp: s.timestampNum,
          target_statement_id: bestTarget.statement_id,
          target_text: bestTarget.statement_text,
          target_timestamp: bestTarget.timestampNum,
          similarity: Number(bestScore.toFixed(6)),
          target_was_already_duplicate: false,
        });
      }
    }
  }
  return merges;
}

const thresholdArg = Deno.args
  .find((a) => a.startsWith("--threshold="))
  ?.split("=")[1];
const THRESHOLD = thresholdArg ? Number(thresholdArg) : 0.80;
if (Number.isNaN(THRESHOLD) || THRESHOLD < 0 || THRESHOLD > 1) {
  console.error(`Invalid --threshold value: ${thresholdArg}`);
  Deno.exit(1);
}

console.log(`Reading ${STATEMENTS_PATH}...`);
const rawStatements = await readCsv<StatementRow>(STATEMENTS_PATH);
console.log(`  ${rawStatements.length} statements`);

console.log(`Reading ${EMBEDDINGS_PATH}...`);
const embeddings = await readCsv<EmbeddingRow>(EMBEDDINGS_PATH);
const embeddingById = new Map<string, number[]>();
for (const row of embeddings) {
  try {
    embeddingById.set(row.statement_id, JSON.parse(row.embedding_json));
  } catch {
    // skip corrupt row
  }
}
console.log(`  ${embeddingById.size} embeddings`);

const enriched: EnrichedStatement[] = [];
let missingEmbedding = 0;
let missingTimestamp = 0;
for (const s of rawStatements) {
  const embedding = embeddingById.get(s.statement_id);
  if (!embedding) {
    missingEmbedding++;
    continue;
  }
  const timestampNum = Number(s.timestamp);
  if (!Number.isFinite(timestampNum) || timestampNum <= 0) {
    missingTimestamp++;
    continue;
  }
  enriched.push({ ...s, embedding, timestampNum });
}
console.log(
  `  enriched: ${enriched.length}  skipped: ${missingEmbedding} no-embedding, ${missingTimestamp} no-timestamp`,
);

const byRoom = new Map<string, EnrichedStatement[]>();
for (const s of enriched) {
  if (!byRoom.has(s.room_id)) byRoom.set(s.room_id, []);
  byRoom.get(s.room_id)!.push(s);
}
console.log(`  ${byRoom.size} rooms`);

console.log("\nSimulating at summary thresholds...");
for (const t of SUMMARY_THRESHOLDS) {
  const merges = simulate(t, byRoom);
  console.log(`  threshold ${t.toFixed(2)}: ${merges.length} merges`);
}

console.log(`\nWriting merges at threshold ${THRESHOLD.toFixed(2)}...`);
const merges = simulate(THRESHOLD, byRoom);

const csv = Papa.unparse(merges, {
  columns: [
    "room_id",
    "topic",
    "duplicate_statement_id",
    "duplicate_text",
    "duplicate_timestamp",
    "target_statement_id",
    "target_text",
    "target_timestamp",
    "similarity",
    "target_was_already_duplicate",
  ],
  quotes: true,
});

await Deno.writeTextFile(OUTPUT_PATH, csv);
console.log(`Wrote ${merges.length} merges to ${OUTPUT_PATH}`);

const mergesByRoom = new Map<string, number>();
for (const m of merges) {
  mergesByRoom.set(m.room_id, (mergesByRoom.get(m.room_id) ?? 0) + 1);
}
const topRooms = [...mergesByRoom.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
console.log("\nTop 10 rooms by merge count:");
for (const [roomId, count] of topRooms) {
  const topic = enriched.find((s) => s.room_id === roomId)?.topic ?? "?";
  console.log(`  ${count.toString().padStart(4)}  ${topic.slice(0, 70)}`);
}
