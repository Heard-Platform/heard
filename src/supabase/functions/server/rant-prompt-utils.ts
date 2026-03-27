import { AiPrompt } from "./types.tsx";

/** Strip markdown code fences (```json ... ```) that some LLMs wrap around JSON output. */
export function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
}

export const RANT_EXTRACTION_RULES = `STRICT Rules:
- Use the author's actual words and phrases whenever possible
- Do NOT add interpretations, implications, or extra meaning
- Do NOT extrapolate beyond what they explicitly said
- Stay faithful to their tone (casual, formal, emotional, etc.)
- Only create statements for arguments they actually made
- Keep their specific examples and concerns intact
- If they used simple language, keep it simple
- If they were emotional, preserve that emotion
- Each statement MUST be a complete, well-formed sentence
- Capitalize the first letter of each statement
- Add minimal wording ONLY if needed to make incomplete thoughts into complete sentences
- Ensure each statement stands alone as something people can vote on`;

export function makeRantExtractionPrompt(rant: string): AiPrompt {
  return {
    systemPrompt:
      "You are a debate topic extractor. You analyze rants and extract clear debate topics and faithful statements. Always return valid JSON.",
    userPrompt: `You are analyzing a user's rant to extract a debate topic and key arguments.

Rant:
${rant.trim()}

Please extract:
1. A clear, concise debate topic (as a question if possible)
2. 3-5 key debate statements that represent the main arguments in the rant

${RANT_EXTRACTION_RULES}

Return ONLY in this exact JSON format, with no other text before or after it:
{
  "topic": "the debate topic here",
  "statements": [
    "first statement",
    "second statement",
    "third statement"
  ]
}`,
  };
}
