import { Hono } from "npm:hono";
import { createClientFromEnv } from "./db-utils.ts";

interface LlmApiCallRow {
  createdAt: string;
  model: string;
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
      .select('"createdAt", model, "totalTokens", "inputTokens", "outputTokens"');

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as LlmApiCallRow[];

    const byDateModel: Record<string, Record<string, number>> = {};
    const modelSet = new Set<string>();

    for (const row of rows) {
      const date = row.createdAt.slice(0, 10);
      modelSet.add(row.model);
      if (!byDateModel[date]) byDateModel[date] = {};
      byDateModel[date][row.model] = (byDateModel[date][row.model] ?? 0) + row.totalTokens;
    }

    const timeline = Object.entries(byDateModel)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, models]) => ({ date, ...models }));

    const models = [...modelSet].sort();

    const totals = rows.reduce(
      (acc, row) => ({
        totalCalls: acc.totalCalls + 1,
        totalTokens: acc.totalTokens + row.totalTokens,
        inputTokens: acc.inputTokens + row.inputTokens,
        outputTokens: acc.outputTokens + row.outputTokens,
      }),
      { totalCalls: 0, totalTokens: 0, inputTokens: 0, outputTokens: 0 },
    );

    return c.json({ timeline, models, totals });
  } catch (error) {
    console.error("Error fetching AI usage data:", error);
    return c.json({ error: "Failed to fetch AI usage data" }, 500);
  }
});

export { app as aiUsageApi };
