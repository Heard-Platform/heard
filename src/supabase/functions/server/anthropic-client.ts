import process from "node:process";
import { AiPrompt } from "./types.tsx";
import { BaseLlmClient, LlmApiResult } from "./llm-client.ts";
import { LlmProvider } from "./llm-usage-logger.ts";

const MODEL = "claude-haiku-4-5-20251001";

export class AnthropicClient extends BaseLlmClient {
  protected readonly provider: LlmProvider = "anthropic";
  protected readonly model: string = MODEL;

  private readonly apiKey: string;

  constructor() {
    super();
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        "ANTHROPIC_API_KEY must be set in environment variables",
      );
    }
    this.apiKey = key;
  }

  protected async callApi(prompt: AiPrompt, _json: boolean): Promise<LlmApiResult> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: prompt.systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt.userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic API error: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("No content in Anthropic response");
    }

    const usage = data.usage ?? {};
    const inputTokens =
      (usage.input_tokens ?? 0) +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0);
    const outputTokens = usage.output_tokens ?? 0;

    return {
      content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    };
  }
}
