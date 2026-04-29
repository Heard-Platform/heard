// @ts-nocheck (Deno script; not type-checked by the project tsc)
/// <reference lib="deno.ns" />
import Papa from "npm:papaparse@5.5.3";

const DATA_DIR = new URL("../public/data/", import.meta.url);
const STATEMENTS_PATH = new URL("statements.csv", DATA_DIR);
const EMBEDDINGS_PATH = new URL("statement-embeddings.csv", DATA_DIR);
const SIMILARITY_PATH = new URL("statement-similarity.csv", DATA_DIR);
const display = (url: URL) => decodeURIComponent(url.pathname);

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
  path: string | URL,
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
  path: string | URL,
  rows: T[],
  columns: string[],
): Promise<void> {
  const csv = Papa.unparse(rows, { columns, quotes: true });
  await Deno.writeTextFile(path, csv);
}

const MAX_RETRIES = 5;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function parseServerRetryDelayMs(body: string): number | null {
  try {
    const parsed = JSON.parse(body);
    const details = parsed?.error?.details ?? [];
    for (const d of details) {
      if (typeof d?.["@type"] === "string" && d["@type"].endsWith("RetryInfo")) {
        const match = String(d.retryDelay ?? "").match(/^(\d+(?:\.\d+)?)s$/);
        if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 500;
      }
    }
  } catch {
    // ignore parse errors; fall back to exponential backoff
  }
  return null;
}

async function embedBatch(
  apiKey: string,
  texts: string[],
): Promise<number[][]> {
  let attempt = 0;
  while (true) {
    attempt++;
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
    if (res.ok) {
      const data = await res.json();
      return data.embeddings.map((e: { values: number[] }) => e.values);
    }
    const body = await res.text();
    const retryable = RETRYABLE_STATUSES.has(res.status);
    if (!retryable || attempt >= MAX_RETRIES) {
      throw new Error(`Gemini batchEmbedContents ${res.status}: ${body}`);
    }
    const serverDelay = parseServerRetryDelayMs(body);
    const delayMs = serverDelay ?? 1000 * 2 ** (attempt - 1);
    const source = serverDelay ? "server" : "backoff";
    console.log(
      `  Gemini ${res.status}; retrying in ${delayMs}ms (${source}, attempt ${attempt + 1}/${MAX_RETRIES})`,
    );
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

async function persistCache(
  statements: StatementRow[],
  embeddingById: Map<string, number[]>,
): Promise<void> {
  const cacheRows: EmbeddingRow[] = statements
    .filter((s) => embeddingById.has(s.statement_id))
    .map((s) => ({
      statement_id: s.statement_id,
      embedding_json: JSON.stringify(embeddingById.get(s.statement_id)),
    }));
  await writeCsv(EMBEDDINGS_PATH, cacheRows, [
    "statement_id",
    "embedding_json",
  ]);
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
  console.error(
    "Missing GEMINI_API_KEY. Set in env or pass --env-file=<path-to-.env>",
  );
  Deno.exit(1);
}

await Deno.mkdir(DATA_DIR, { recursive: true });

console.log(`Reading ${display(STATEMENTS_PATH)}...`);
const rawStatements = await readCsv<StatementRow>(STATEMENTS_PATH);
const statements = rawStatements.filter((s) => s.statement_text.trim().length > 0);
console.log(
  `  ${statements.length} statements (${rawStatements.length - statements.length} skipped as empty)`,
);

console.log(`Reading ${display(EMBEDDINGS_PATH)} cache...`);
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
  await persistCache(statements, embeddingById);
  console.log(`  batch ${i / BATCH_SIZE + 1}: +${batch.length} (cache size: ${embeddingById.size})`);
}

if (missing.length > 0) {
  console.log(`Wrote ${embeddingById.size} rows to ${display(EMBEDDINGS_PATH)}`);
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
console.log(`Wrote ${similarityRows.length} pairs to ${display(SIMILARITY_PATH)}`);
