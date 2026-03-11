import process from "node:process";
import { LlmClient } from "./llm-client.ts";
import { OpenAiClient } from "./openai-client.ts";
import { AnthropicClient } from "./anthropic-client.ts";
import { GeminiClient } from "./gemini-client.ts";

// Set LLM_PROVIDER in .env to switch providers.
// Accepted values: "openai" (default) | "anthropic" | "gemini"
export type LlmProvider = "openai" | "anthropic" | "gemini";

export function createLlmClient(): LlmClient {
  const provider = process.env.LLM_PROVIDER ?? "openai";

  switch (provider) {
    case "anthropic":
      return new AnthropicClient();
    case "gemini":
      return new GeminiClient();
    case "openai":
      return new OpenAiClient();
    default:
      throw new Error(
        `Unknown LLM_PROVIDER "${provider}". Valid values: "openai", "anthropic", "gemini"`,
      );
  }
}
