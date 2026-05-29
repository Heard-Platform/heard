import process from "node:process";
import { insert } from "./db-utils.ts";
import { LlmProvider, NormalizedUsage } from "./llm-types.ts";

const LLM_API_CALLS_TABLE = "llm_api_calls";
const TEST_ENV = "test";

export interface LlmUsageRecord extends NormalizedUsage {
  provider: LlmProvider;
  model: string;
  userId?: string;
  endpoint: string;
}

export const recordLlmUsage = (record: LlmUsageRecord): void => {
  if (process.env.NODE_ENV === TEST_ENV) return;
  void insert(LLM_API_CALLS_TABLE, record).catch(
    (err) => console.error("llm-usage-logger: insert threw", err),
  );
};
