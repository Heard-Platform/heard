import process from "node:process";
import { AiPrompt } from "./types.tsx";
import { BaseLlmClient, LlmApiResult } from "./llm-client.ts";
import { LlmProvider } from "./llm-types.ts";

const MODEL = "gpt-4o-mini";

export class OpenAiClient extends BaseLlmClient {
  protected readonly provider: LlmProvider = "openai";
  protected readonly model: string = MODEL;

  private readonly openAiApiKey: string;

  constructor() {
    super();
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OPENAI_API_KEY must be set in environment variables",
      );
    }
    this.openAiApiKey = key;
  }

  protected async callApi(prompt: AiPrompt, json: boolean): Promise<LlmApiResult> {
    const body: Record<string, unknown> = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: prompt.systemPrompt,
        },
        {
          role: "user",
          content: prompt.userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    if (json) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API error: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return {
      content,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  }
}
