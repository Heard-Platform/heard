import process from "node:process";
import { LlmClient } from "./llm-client.ts";
import { OpenAiClient } from "./openai-client.ts";
import { AnthropicClient } from "./anthropic-client.ts";

// Set LLM_PROVIDER in .env to switch providers.
// Accepted values: "openai" (default) | "anthropic"
export type LlmProvider = "openai" | "anthropic";

export function createLlmClient(): LlmClient {
  const provider = process.env.LLM_PROVIDER ?? "openai";

  switch (provider) {
    case "anthropic":
      return new AnthropicClient();
    case "openai":
      return new OpenAiClient();
    default:
      throw new Error(
        `Unknown LLM_PROVIDER "${provider}". Valid values: "openai", "anthropic"`,
      );
  }
}
