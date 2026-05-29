import process from "node:process";
import { AiPrompt } from "./types.tsx";
import { BaseLlmClient, LlmApiResult } from "./llm-client.ts";
import { LlmProvider } from "./llm-usage-logger.ts";

const MODEL = "gemini-2.5-flash";

export class GeminiClient extends BaseLlmClient {
  protected readonly provider: LlmProvider = "gemini";
  protected readonly model: string = MODEL;

  private readonly apiKey: string;

  constructor() {
    super();
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY must be set in environment variables",
      );
    }
    this.apiKey = key;
  }

  protected async callApi(prompt: AiPrompt, json: boolean): Promise<LlmApiResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: 500,
      temperature: 0.7,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    };

    if (json) {
      generationConfig.responseMimeType = "application/json";
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: prompt.systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt.userPrompt }],
          },
        ],
        generationConfig,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content in Gemini response");
    }

    const usage = data.usageMetadata ?? {};

    return {
      content,
      usage: {
        inputTokens: usage.promptTokenCount ?? 0,
        outputTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
      },
    };
  }
}
