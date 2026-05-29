export type LlmProvider = "openai" | "anthropic" | "gemini";

export interface NormalizedUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
