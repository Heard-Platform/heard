# LLM Grader System

## Purpose

Traditional unit test assertions break down when testing LLM outputs because two semantically identical responses rarely share exact text. The LLM Grader replaces exact-match assertions with a semantic similarity score: send an `expected` value and an `actual` value to the configured LLM provider, get back a score from 0 to 100.

A score of 100 means the outputs are effectively equivalent. A score of 0 means they share no meaningful content. Tests set a minimum acceptable threshold (e.g. `score >= 70`) rather than requiring an exact match.

---

## How It Works

1. The caller provides a `GradeRequest` with `expected`, `actual`, and an optional `context` hint.
2. `makeLlmGraderPrompt()` builds an `AiPrompt` containing both values and a scoring rubric.
3. `LlmGrader.grade()` sends the prompt to whichever provider is configured via `LLM_PROVIDER` using `LlmClient.completeJson()`.
4. The response is parsed and the `score` is clamped to `[0, 100]`.
5. A `GradeResult` containing `score` and `reasoning` is returned to the caller.

### Scoring rubric

| Score | Meaning |
|-------|---------|
| 100 | Identical or semantically equivalent |
| 80-99 | Same core meaning, minor wording differences |
| 60-79 | Mostly aligned, some missing or different detail |
| 40-59 | Partial overlap, significant differences |
| 20-39 | Related concepts, largely different content |
| 0-19 | Fundamentally different or no meaningful overlap |

---

## Public API

### Types

```typescript
type GradeRequest = {
  expected: string;   // the ideal / reference output
  actual: string;     // the output under test
  context?: string;   // optional domain hint (improves accuracy for specialized content)
};

type GradeResult = {
  score: number;      // 0-100
  reasoning: string;  // one-sentence explanation from the LLM
};
```

### `makeLlmGraderPrompt(request: GradeRequest): AiPrompt`

Builds the grading prompt. Useful if you need to inspect or log the prompt before sending.

### `class LlmGrader`

```typescript
const grader = new LlmGrader();           // uses LLM_PROVIDER env var
const grader = new LlmGrader(myClient);   // inject a specific LlmClient
const result = await grader.grade(request);
```

### `grade(request, client?): Promise<GradeResult>`

Convenience wrapper — creates a `LlmGrader` and calls `grade()` in one step. Use this in tests.

---

## Usage in a Deno Test

```typescript
import { grade } from "./llm-grader.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("rant extraction captures the main topic", async () => {
  const rant = "I hate that my gym plays terrible music so loud you can't think.";
  const extracted = await extractTopic(rant);

  const result = await grade({
    expected: "The gym plays music that is too loud and of poor quality.",
    actual: extracted.topic,
    context: "Debate topic extraction from a user rant",
  });

  assert(result.score >= 70, `Score ${result.score}: ${result.reasoning}`);
});
```

### Choosing a threshold

| Use case | Suggested minimum |
|----------|------------------|
| Core meaning must be preserved | 70 |
| Near-exact phrasing required | 85 |
| Loose semantic check | 50 |

---

## The `context` Field

When the domain is specialized, adding `context` helps the grader interpret both values correctly.

Without context, the grader may penalize legitimate paraphrasing. With context, it understands what counts as "equivalent" in your domain.

```typescript
// Without context: grader might penalize "They play annoying music" vs "Music quality is poor"
// With context: grader understands both describe the same complaint in a debate framing
grade({
  expected: "The gym plays music that is too loud and of poor quality.",
  actual: extracted.topic,
  context: "Debate topic extraction: rephrase as general claim",
});
```

---

## Provider Note

The grader uses whatever provider is set in `LLM_PROVIDER` (`gemini` by default). You can override it by injecting a specific `LlmClient`:

```typescript
import { createLlmClient } from "./llm-provider.ts";
import { LlmGrader } from "./llm-grader.ts";

const grader = new LlmGrader(createLlmClient("anthropic"));
```

All three providers (Gemini, Anthropic, OpenAI) support the JSON response mode used by the grader.
