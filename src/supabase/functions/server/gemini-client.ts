import process from "node:process";
import { AiPrompt } from "./types.tsx";
import { LlmClient } from "./llm-client.ts";

const MODEL = "gemini-2.5-flash";

export class GeminiClient implements LlmClient {
  private readonly apiKey: string;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY must be set in environment variables",
      );
    }
    this.apiKey = key;
  }

  async complete(prompt: AiPrompt): Promise<string> {
    return this.request(prompt, false);
  }

  async completeJson(prompt: AiPrompt): Promise<string> {
    return this.request(prompt, true);
  }

  private async request(prompt: AiPrompt, json: boolean): Promise<string> {
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

    return content;
  }
}
