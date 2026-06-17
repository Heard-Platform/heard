import { Hono } from "npm:hono";
import { createClientFromEnv } from "./db-utils.ts";

interface LlmApiCallRow {
  createdAt: string;
  endpoint: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
}

const app = new Hono();

app.get("/make-server-f1a393b4/public-ai-usage", async (c) => {
  try {
    const supabase = createClientFromEnv();
    const { data, error } = await supabase
      .from("llm_api_calls")
      .select('"createdAt", endpoint, "totalTokens", "inputTokens", "outputTokens"');

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as LlmApiCallRow[];

    const tokensByDateAndEndpoint = new Map<string, Map<string, number>>();
    for (const row of rows) {
      const date = row.createdAt.slice(0, 10);
      const endpoint = row.endpoint ?? "unknown";
      if (!tokensByDateAndEndpoint.has(date)) tokensByDateAndEndpoint.set(date, new Map());
      const tokens = tokensByDateAndEndpoint.get(date)!;
      tokens.set(endpoint, (tokens.get(endpoint) ?? 0) + row.totalTokens);
    }

    const timeline = [...tokensByDateAndEndpoint.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tokensByEndpoint]) => ({ date, ...Object.fromEntries(tokensByEndpoint) }));

    const endpoints = [...new Set(rows.map((r) => r.endpoint ?? "unknown"))].sort();

    const totals = rows.reduce(
      (acc, row) => ({
        totalCalls: acc.totalCalls + 1,
        totalTokens: acc.totalTokens + row.totalTokens,
        inputTokens: acc.inputTokens + row.inputTokens,
        outputTokens: acc.outputTokens + row.outputTokens,
      }),
      { totalCalls: 0, totalTokens: 0, inputTokens: 0, outputTokens: 0 },
    );

    return c.json({ timeline, endpoints, totals });
  } catch (error) {
    console.error("Error fetching AI usage data:", error);
    return c.json({ error: "Failed to fetch AI usage data" }, 500);
  }
});

export { app as aiUsageApi };
