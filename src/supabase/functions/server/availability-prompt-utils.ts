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

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;
const DEFAULT_LABEL = "availability extraction";

const AVAILABILITY_UNION = AVAILABILITY_VALUES.map((v) => `"${v}"`).join(" | ");
const CONFIDENCE_UNION = CONFIDENCE_VALUES.map((v) => `"${v}"`).join(" | ");

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
      "availability": ${AVAILABILITY_UNION},
      "confidence": ${CONFIDENCE_UNION},
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

function ensure(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateAvailabilityExtraction(
  value: unknown,
  label: string = DEFAULT_LABEL,
): AvailabilityExtraction {
  ensure(isRecord(value), `[${label}] response must be an object`);
  ensure(Array.isArray(value.resolved), `[${label}] resolved must be an array`);
  ensure(Array.isArray(value.ambiguous), `[${label}] ambiguous must be an array`);
  ensure(
    typeof value.referenceDate === "string" && ISO_DATE_REGEX.test(value.referenceDate),
    `[${label}] referenceDate must be YYYY-MM-DD, got "${String(value.referenceDate)}"`,
  );

  for (const item of value.resolved as unknown[]) {
    ensure(isRecord(item), `[${label}] resolved entries must be objects`);
    ensure(
      typeof item.date === "string" && ISO_DATE_REGEX.test(item.date),
      `[${label}] resolved.date must be YYYY-MM-DD, got "${String(item.date)}"`,
    );
    ensure(
      typeof item.availability === "string" &&
        (AVAILABILITY_VALUES as readonly string[]).includes(item.availability),
      `[${label}] resolved.availability invalid: "${String(item.availability)}"`,
    );
    ensure(
      typeof item.confidence === "string" &&
        (CONFIDENCE_VALUES as readonly string[]).includes(item.confidence),
      `[${label}] resolved.confidence invalid: "${String(item.confidence)}"`,
    );
    ensure(
      typeof item.sourceQuote === "string" && item.sourceQuote.length > 0,
      `[${label}] resolved.sourceQuote required`,
    );
    if (item.timeRange !== undefined) {
      ensure(isRecord(item.timeRange), `[${label}] resolved.timeRange must be an object when present`);
      ensure(
        typeof item.timeRange.start === "string" && TIME_REGEX.test(item.timeRange.start) &&
          typeof item.timeRange.end === "string" && TIME_REGEX.test(item.timeRange.end),
        `[${label}] timeRange must use HH:mm, got ${JSON.stringify(item.timeRange)}`,
      );
    }
  }

  for (const item of value.ambiguous as unknown[]) {
    ensure(isRecord(item), `[${label}] ambiguous entries must be objects`);
    ensure(
      typeof item.mention === "string" && item.mention.length > 0,
      `[${label}] ambiguous.mention required`,
    );
    ensure(
      typeof item.reason === "string" && item.reason.length > 0,
      `[${label}] ambiguous.reason required`,
    );
    ensure(
      typeof item.sourceQuote === "string" && item.sourceQuote.length > 0,
      `[${label}] ambiguous.sourceQuote required`,
    );
  }

  return value as unknown as AvailabilityExtraction;
}

export function parseAvailabilityExtraction(
  raw: string,
  label: string = DEFAULT_LABEL,
): AvailabilityExtraction {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownFences(raw));
  } catch {
    throw new Error(`[${label}] response is not valid JSON:\n${raw}`);
  }
  return validateAvailabilityExtraction(parsed, label);
}
