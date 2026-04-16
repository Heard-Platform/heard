import process from "node:process";
import { AiPrompt } from "./types.tsx";
import { LlmClient } from "./llm-client.ts";

export class AnthropicClient implements LlmClient {
  private readonly apiKey: string;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        "ANTHROPIC_API_KEY must be set in environment variables",
      );
    }
    this.apiKey = key;
  }

  async complete(prompt: AiPrompt): Promise<string> {
    return this.request(prompt);
  }

  async completeJson(prompt: AiPrompt): Promise<string> {
    // Anthropic has no native JSON mode — rely on prompt instructions
    return this.request(prompt);
  }

  private async request(prompt: AiPrompt): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
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

    return content;
  }
}
