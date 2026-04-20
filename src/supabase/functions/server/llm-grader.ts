import type { AiPrompt } from "./types.tsx";
import type { LlmClient } from "./llm-client.ts";
import { createLlmClient } from "./llm-provider.ts";
import { stripMarkdownFences } from "./rant-prompt-utils.ts";

export type GradeRequest = {
  expected: string;
  actual: string;
  context?: string;
};

export type GradeResult = {
  score: number;
  reasoning: string;
};

export function makeLlmGraderPrompt(request: GradeRequest): AiPrompt {
  const contextLine = request.context
    ? `\nContext: ${request.context}\n`
    : "";

  return {
    systemPrompt:
      "You are a strict semantic equivalence evaluator. Compare an expected value against an actual value and return a numeric similarity score. Always return valid JSON.",
    userPrompt: `Compare these two values and score how well the actual matches the expected.
${contextLine}
EXPECTED:
${request.expected}

ACTUAL:
${request.actual}

Scoring rubric:
- 100: Identical or semantically equivalent, all key details match
- 80-99: Same core meaning, minor wording differences
- 60-79: Mostly aligned, some missing or slightly different details
- 40-59: Partial overlap, significant differences present
- 20-39: Related concepts but largely different content
- 0-19: Fundamentally different or no meaningful overlap

Return ONLY valid JSON with two fields: "score" (integer 0-100) and "reasoning" (one sentence string).
Example: {"score": 75, "reasoning": "The actual captures the core claim but omits several specific details."}`,
  };
}

export class LlmGrader {
  private client: LlmClient;

  constructor(client?: LlmClient) {
    this.client = client ?? createLlmClient();
  }

  async grade(request: GradeRequest): Promise<GradeResult> {
    try {
      return await this.attempt(request);
    } catch {
      return this.attempt(request);
    }
  }

  private async attempt(request: GradeRequest): Promise<GradeResult> {
    const prompt = makeLlmGraderPrompt(request);
    const raw = await this.client.completeJson(prompt);
    const cleaned = stripMarkdownFences(raw);

    let parsed: { score: unknown; reasoning: unknown };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`LlmGrader: failed to parse response as JSON: ${raw}`);
    }

    if (typeof parsed.score !== "number" || typeof parsed.reasoning !== "string") {
      throw new Error(`LlmGrader: unexpected response shape: ${raw}`);
    }

    return {
      score: Math.round(Math.max(0, Math.min(100, parsed.score))),
      reasoning: parsed.reasoning,
    };
  }
}

export function grade(
  request: GradeRequest,
  client?: LlmClient,
): Promise<GradeResult> {
  return new LlmGrader(client).grade(request);
}
