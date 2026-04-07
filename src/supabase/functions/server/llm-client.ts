import { AiPrompt } from "./types.tsx";

export interface LlmClient {
  complete(prompt: AiPrompt): Promise<string>;
  completeJson(prompt: AiPrompt): Promise<string>;
}
