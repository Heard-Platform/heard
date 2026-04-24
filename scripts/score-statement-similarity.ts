/// <reference lib="deno.ns" />
import Papa from "npm:papaparse@5.5.3";

const STATEMENTS_PATH = "public/data/statements.csv";
const EMBEDDINGS_PATH = "public/data/statement-embeddings.csv";
const SIMILARITY_PATH = "public/data/statement-similarity.csv";

const MODEL = "gemini-embedding-001";
const EMBED_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`;
const BATCH_SIZE = 100;

type StatementRow = {
  room_id: string;
  topic: string;
  statement_id: string;
  statement_text: string;
};

type EmbeddingRow = {
  statement_id: string;
  embedding_json: string;
};

type SimilarityRow = {
  topic: string;
  statement_1: string;
  statement_2: string;
  cosine_similarity: string;
};

async function readCsv<T extends Record<string, string>>(
  path: string,
): Promise<T[]> {
  try {
    const text = await Deno.readTextFile(path);
    const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
    return parsed.data.filter(
      (r: Record<string, string>) => r && Object.keys(r).length > 0,
    );
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return [];
    throw err;
  }
}

async function writeCsv<T extends Record<string, unknown>>(
  path: string,
  rows: T[],
  columns: string[],
): Promise<void> {
  const csv = Papa.unparse(rows, { columns, quotes: true });
  await Deno.writeTextFile(path, csv);
}

async function embedBatch(
  apiKey: string,
  texts: string[],
): Promise<number[][]> {
  const res = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      requests: texts.map((t) => ({
        model: `models/${MODEL}`,
        content: { parts: [{ text: t }] },
      })),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini batchEmbedContents ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.embeddings.map((e: { values: number[] }) => e.values);
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

const apiKey = Deno.env.get("GEMINI_API_KEY");
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY. Set in env or pass --env-file=.env");
  Deno.exit(1);
}

console.log(`Reading ${STATEMENTS_PATH}...`);
const rawStatements = await readCsv<StatementRow>(STATEMENTS_PATH);
const statements = rawStatements.filter((s) => s.statement_text.trim().length > 0);
console.log(
  `  ${statements.length} statements (${rawStatements.length - statements.length} skipped as empty)`,
);

console.log(`Reading ${EMBEDDINGS_PATH} cache...`);
const cached = await readCsv<EmbeddingRow>(EMBEDDINGS_PATH);
const embeddingById = new Map<string, number[]>();
for (const row of cached) {
  try {
    embeddingById.set(row.statement_id, JSON.parse(row.embedding_json));
  } catch {
    // skip corrupt cache row
  }
}
console.log(`  ${embeddingById.size} cached embeddings`);

const missing = statements.filter((s) => !embeddingById.has(s.statement_id));
console.log(`Embedding ${missing.length} new statements...`);

for (let i = 0; i < missing.length; i += BATCH_SIZE) {
  const batch = missing.slice(i, i + BATCH_SIZE);
  const vectors = await embedBatch(apiKey, batch.map((s) => s.statement_text));
  batch.forEach((s, j) => embeddingById.set(s.statement_id, vectors[j]));
  console.log(`  batch ${i / BATCH_SIZE + 1}: +${batch.length}`);
}

if (missing.length > 0) {
  const cacheRows: EmbeddingRow[] = statements
    .filter((s) => embeddingById.has(s.statement_id))
    .map((s) => ({
      statement_id: s.statement_id,
      embedding_json: JSON.stringify(embeddingById.get(s.statement_id)),
    }));
  await writeCsv(EMBEDDINGS_PATH, cacheRows, ["statement_id", "embedding_json"]);
  console.log(`Wrote ${cacheRows.length} rows to ${EMBEDDINGS_PATH}`);
}

console.log("Computing pairwise similarity per room...");
const byRoom = new Map<string, StatementRow[]>();
for (const s of statements) {
  if (!byRoom.has(s.room_id)) byRoom.set(s.room_id, []);
  byRoom.get(s.room_id)!.push(s);
}

const similarityRows: SimilarityRow[] = [];
for (const roomStatements of byRoom.values()) {
  roomStatements.sort((a, b) => a.statement_id.localeCompare(b.statement_id));
  for (let i = 0; i < roomStatements.length; i++) {
    for (let j = i + 1; j < roomStatements.length; j++) {
      const a = roomStatements[i];
      const b = roomStatements[j];
      const va = embeddingById.get(a.statement_id);
      const vb = embeddingById.get(b.statement_id);
      if (!va || !vb) continue;
      similarityRows.push({
        topic: a.topic,
        statement_1: a.statement_text,
        statement_2: b.statement_text,
        cosine_similarity: cosine(va, vb).toFixed(6),
      });
    }
  }
}

await writeCsv(SIMILARITY_PATH, similarityRows, [
  "topic",
  "statement_1",
  "statement_2",
  "cosine_similarity",
]);
console.log(`Wrote ${similarityRows.length} pairs to ${SIMILARITY_PATH}`);
