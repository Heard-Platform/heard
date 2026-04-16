import { AiPrompt } from "./types.tsx";
import { stripMarkdownFences } from "./rant-prompt-utils.ts";

export const AVAILABILITY_VALUES = ["available", "unavailable", "preferred", "tentative"] as const;
export type AvailabilityValue = (typeof AVAILABILITY_VALUES)[number];

export const CONFIDENCE_VALUES = ["high", "medium", "low"] as const;
export type ConfidenceValue = (typeof CONFIDENCE_VALUES)[number];

export interface ResolvedAvailability {
  date: string;
  timeRange?: { start: string; end: string };
  availability: AvailabilityValue;
  confidence: ConfidenceValue;
  sourceQuote: string;
}

export interface AmbiguousAvailability {
  mention: string;
  reason: string;
  sourceQuote: string;
}

export interface AvailabilityExtraction {
  resolved: ResolvedAvailability[];
  ambiguous: AmbiguousAvailability[];
  referenceDate: string;
}

export const AVAILABILITY_EXTRACTION_RULES = `STRICT Rules:
- Extract only availability information the author explicitly mentioned. Do not invent or extrapolate.
- Resolve relative dates ("next Tuesday", "this weekend") against the reference date. Include only dates you can resolve with confidence.
- If a mention is too vague to resolve to a specific date (e.g. "sometime next month", "the weekend after that other thing"), add it to "ambiguous" with a short reason. Do NOT guess.
- "availability" values:
  - "available": author said they are free
  - "unavailable": author said they are busy or cannot do this date
  - "preferred": author expressed a preference for this date over others
  - "tentative": author said they MIGHT be free but were not sure
- "confidence" reflects how confident YOU are in the extraction (date resolution, availability category, time range). Use "high" only when the rant was explicit. Use "low" when interpretation was required.
- Include "timeRange" only when the author specified times. Omit it otherwise (do not default to a full day).
- When "timeRange" is included, both "start" and "end" must be HH:mm strings. Never use null or omit one side.
- For open-ended times, use sentinels: "after 7pm" means end is "23:59"; "before noon" means start is "00:00"; "morning" means "00:00"-"12:00"; "evening" means "18:00"-"23:59".
- "sourceQuote" must be a verbatim substring of the rant, showing where the extraction came from.
- Echo back the reference date in "referenceDate".
- If the rant contains no extractable availability information, return empty arrays.`;

export function makeAvailabilityExtractionPrompt(rant: string, referenceDate: string): AiPrompt {
  return {
    systemPrompt:
      "You are a scheduling assistant. You analyze scheduling rants and extract structured availability data. You prefer to admit uncertainty over guessing. Always return valid JSON.",
    userPrompt: `You are analyzing a user's rant about their availability for an upcoming event.

Reference date (treat as "today"): ${referenceDate}

Rant:
${rant.trim()}

Extract the author's availability as structured JSON. Split the extraction into two groups:
- "resolved": specific dates you can pin down
- "ambiguous": mentions too vague to resolve to a specific date

${AVAILABILITY_EXTRACTION_RULES}

Return ONLY in this exact JSON format, with no other text before or after it:
{
  "resolved": [
    {
      "date": "YYYY-MM-DD",
      "timeRange": { "start": "HH:mm", "end": "HH:mm" },
      "availability": "available" | "unavailable" | "preferred" | "tentative",
      "confidence": "high" | "medium" | "low",
      "sourceQuote": "verbatim substring of the rant"
    }
  ],
  "ambiguous": [
    {
      "mention": "what the author said",
      "reason": "why it could not be resolved",
      "sourceQuote": "verbatim substring of the rant"
    }
  ],
  "referenceDate": "${referenceDate}"
}`,
  };
}

export function parseAvailabilityExtraction(raw: string): AvailabilityExtraction {
  return JSON.parse(stripMarkdownFences(raw)) as AvailabilityExtraction;
}
