import process from "node:process";
import { AiPrompt } from "./types.tsx";

export class OpenAiClient {
  private openAiApiKey?;

  constructor() {
    this.openAiApiKey = process.env.OPENAI_API_KEY;
    if (!this.openAiApiKey) {
      throw new Error(
        "OPENAI_API_KEY must be set in environment variables",
      );
    }
  }

  async complete(prompt: AiPrompt): Promise<string> {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
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
        }),
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

    return content;
  }
}
