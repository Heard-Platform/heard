import { AiPrompt } from "./types.tsx";

/** Strip markdown code fences (```json ... ```) that some LLMs wrap around JSON output. */
export function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
}

export const RANT_EXTRACTION_RULES = `STRICT Rules:
- Each statement must be something a stranger with no connection to the author can read and vote agree or disagree on from their own perspective. The voters are random users who do not know the author or the author's situation.
- Rephrase first-person statements into general claims about the subject. For example, "I like the music they were playing" should become "They play good music". Preserve the author's opinion but remove the author's personal framing.
- Use present tense for claims about ongoing traits, behaviors, or qualities (e.g. "They play good music", not "They were playing good music") unless the author was specifically talking about a one-time event.
- Skip anything that is purely about the author's personal experience or history that a stranger cannot evaluate. For example, "I've only been there once" or "I went on Tuesday" should not become statements.
- Preserve the author's substantive opinion: if they said something is good, the statement should say it is good. Do not soften, intensify, or reinterpret what they meant.
- Only create statements for arguments the author actually made. Do not extrapolate or invent claims.
- Stay faithful to the tone (casual, formal, emotional, etc.)
- Keep any specific names, places, or examples the author mentioned.
- Each statement must be a complete, well-formed sentence.
- Capitalize the first letter of each statement.`;

export function makeRantExtractionPrompt(rant: string): AiPrompt {
  return {
    systemPrompt:
      "You are a debate topic extractor. You analyze rants and extract debate topics and seed statements that strangers to the author can meaningfully vote on from their own perspective. Always return valid JSON.",
    userPrompt: `You are analyzing a user's rant to extract a debate topic and a set of seed statements.

These statements will be shown to other users, who are strangers to the author, and they will vote agree or disagree on each one from their own perspective. Phrase each statement so that anyone could meaningfully vote on it without needing to know who the author is or what their personal circumstances are.

Rant:
${rant.trim()}

Please extract:
1. A clear, concise debate topic (as a question if possible)
2. 3-5 seed statements that capture the main opinions or claims in the rant, rephrased as general claims that anyone could agree or disagree with

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
