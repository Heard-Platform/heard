import process from "node:process";
import { LlmClient } from "./llm-client.ts";
import { OpenAiClient } from "./openai-client.ts";
import { AnthropicClient } from "./anthropic-client.ts";
import { GeminiClient } from "./gemini-client.ts";

export type LlmProvider = "openai" | "anthropic" | "gemini";

export function getLlmProvider(envVarName: string = "LLM_PROVIDER"): LlmProvider {
  const provider = process.env[envVarName] ?? "gemini";
  if (provider !== "openai" && provider !== "anthropic" && provider !== "gemini") {
    throw new Error(
      `Unknown ${envVarName} "${provider}". Valid values: "openai", "anthropic", "gemini"`,
    );
  }
  return provider;
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
