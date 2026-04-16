import process from "node:process";
import { LlmClient } from "./llm-client.ts";
import { OpenAiClient } from "./openai-client.ts";
import { AnthropicClient } from "./anthropic-client.ts";
import { GeminiClient } from "./gemini-client.ts";

export const LLM_PROVIDERS = ["openai", "anthropic", "gemini"] as const;
export type LlmProvider = (typeof LLM_PROVIDERS)[number];

const DEFAULT_PROVIDER: LlmProvider = "gemini";

export function getLlmProvider(envVarName: string = "LLM_PROVIDER"): LlmProvider {
  const provider = process.env[envVarName] ?? DEFAULT_PROVIDER;
  if (!(LLM_PROVIDERS as readonly string[]).includes(provider)) {
    const valid = LLM_PROVIDERS.map((p) => `"${p}"`).join(", ");
    throw new Error(`Unknown ${envVarName} "${provider}". Valid values: ${valid}`);
  }
  return provider as LlmProvider;
}

export function createLlmClient(provider: LlmProvider = getLlmProvider()): LlmClient {
  switch (provider) {
    case "anthropic":
      return new AnthropicClient();
    case "gemini":
      return new GeminiClient();
    case "openai":
      return new OpenAiClient();
  }
}
