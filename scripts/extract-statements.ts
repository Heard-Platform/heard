/// <reference lib="deno.ns" />
import Papa from "npm:papaparse@5.5.3";

const OUTPUT_PATH = "public/data/statements.csv";

type AdminDebate = {
  id: string;
  topic: string;
};

type RoomResponseStatement = {
  id: string;
  text: string;
  roomId: string;
  timestamp: number;
};

type RoomResponse = {
  room: AdminDebate;
  statements: RoomResponseStatement[];
};

type CsvRow = {
  room_id: string;
  topic: string;
  statement_id: string;
  statement_text: string;
  timestamp: number;
};

const projectId = Deno.env.get("VITE_SUPABASE_PROJECT_ID");
const anonKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");
const apiSecret = Deno.env.get("VITE_HEARD_API_SECRET");
const adminKey = Deno.env.get("DEV_ADMIN_KEY");
if (!projectId || !anonKey || !apiSecret || !adminKey) {
  console.error(
    "Missing one of: VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_ANON_KEY, VITE_HEARD_API_SECRET, DEV_ADMIN_KEY",
  );
  Deno.exit(1);
}

const BASE_URL =
  `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4`;

const baseHeaders = {
  "Authorization": `Bearer ${anonKey}`,
  "X-API-Key": apiSecret,
};

const REQUEST_TIMEOUT_MS = 15_000;

async function request<T>(
  path: string,
  init?: RequestInit & { sessionId?: string },
): Promise<T> {
  const headers: Record<string, string> = { ...baseHeaders };
  if (init?.sessionId) headers["X-Session-Id"] = init.sessionId;
  if (init?.body) headers["Content-Type"] = "application/json";
  const extra = init?.headers as Record<string, string> | undefined;
  if (extra) Object.assign(headers, extra);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: init?.method ?? "GET",
      headers,
      body: init?.body,
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `${init?.method ?? "GET"} ${path} -> ${res.status}: ${body}`,
      );
    }
    return await res.json() as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(
        `${init?.method ?? "GET"} ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

console.log("Creating anonymous session...");
const { sessionId } = await request<{ sessionId: string }>("/user/anonymous", {
  method: "POST",
  body: JSON.stringify({
    environment: "extract-script",
    fingerprint: "extract-script",
    userAgent: "extract-script",
    webdriver: false,
  }),
});
console.log(`  sessionId acquired`);

console.log("Fetching debates...");
const { debates } = await request<{ debates: AdminDebate[] }>(
  "/admin/debates",
  { headers: { "X-Admin-Key": adminKey } },
);
console.log(`  ${debates.length} debates`);

const rows: CsvRow[] = [];
for (const debate of debates) {
  const { room, statements } = await request<RoomResponse>(
    `/room/${debate.id}`,
    { sessionId },
  );
  for (const s of statements) {
    if (!s.id || typeof s.text !== "string") continue;
    rows.push({
      room_id: room.id,
      topic: room.topic ?? "",
      statement_id: s.id,
      statement_text: s.text,
      timestamp: s.timestamp ?? 0,
    });
  }
  console.log(`  room ${room.id}: ${statements.length} statements`);
}

const csv = Papa.unparse(rows, {
  columns: ["room_id", "topic", "statement_id", "statement_text", "timestamp"],
  quotes: true,
});

await Deno.writeTextFile(OUTPUT_PATH, csv);
console.log(`Wrote ${rows.length} rows to ${OUTPUT_PATH}`);
