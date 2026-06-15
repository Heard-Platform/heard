import { getRandomPersona } from "./personas.tsx";
import { AiPrompt, GGWashArticle } from "./types.tsx";
import { LlmProvider } from "./llm-provider.ts";
import { stripMarkdownFences } from "./rant-prompt-utils.ts";

export const SELECTION_SNIPPET_CHARS = 200;
export const LLM_ERROR_SENTINEL = "Error";

export const HEARD_DESCRIPTION =
  `Heard is a discussion app for the Washington, DC area. People react to a topic by voting agree or disagree on short statements and adding their own. A good Heard post is an article about a specific, debatable, or interesting DC topic that locals would have opinions about.`;

const EXCLUSION_RULES =
  `EXCLUDE an article if ANY of these apply:
- It is benign or purely informational with nothing to debate: staff or hiring announcements, intern introductions, newsletter housekeeping, routine "breaks ground" or project-update notices, award notices, event listings, or weekly games and puzzles.
- It is a "Breakfast links" post or any multi-link roundup. Any article whose title begins with "Breakfast links" must ALWAYS be excluded, even if its content seems newsworthy or DC-focused; a roundup has no single topic to discuss.
- It is not focused on the District of Columbia itself. This rule is strict. Keep ONLY articles whose subject is DC. Exclude any article about Virginia (including Arlington, Alexandria, Fairfax, or Falls Church) or about Maryland (including Montgomery County, Prince George's County, Bethesda, or Silver Spring), even if it relates to the broader region. Also exclude mixed articles that cover DC together with Maryland or Virginia. When the jurisdiction is unclear, exclude.`;

const GOOD_TOPIC_GUIDANCE =
  `Hot, timely, or mildly controversial DC topics are good: transit, housing, development, bike and car culture, local policy, a mayoral or council race, new technology in the city like Waymo, neighborhood change, and so on. A good topic does NOT need to be evergreen, open-ended, or experience-based. News, a named person, an election, or a call to action are all acceptable subjects as long as the topic is about DC and people would have opinions on it.`;

export function makeGGWashSelectionPrompt(
  articles: GGWashArticle[],
): AiPrompt {
  const systemPrompt = `${HEARD_DESCRIPTION}

You are choosing which of today's Greater Greater Washington articles would spark the best Heard discussion for a Washington, DC audience. Reply with JSON only.`;

  const list = articles
    .map((article, index) => {
      const snippet = article.body
        .slice(0, SELECTION_SNIPPET_CHARS)
        .replace(/\s+/g, " ")
        .trim();
      return `${index}. ${article.title}\n   ${snippet}`;
    })
    .join("\n\n");

  const userPrompt =
    `Here are today's candidate articles, each as "index. title" followed by a short excerpt:

${list}

Pick the articles that would make the best Heard discussions. ${GOOD_TOPIC_GUIDANCE}

${EXCLUSION_RULES}

Return ONLY JSON of the form {"ranked": [<indices>]}, listing the 0-based indices from the list above of the articles worth posting, best first. If none qualify, return {"ranked": []}.`;

  return { systemPrompt, userPrompt };
}

export function parseSelectionResponse(
  raw: string,
  candidateCount: number,
): number[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownFences(raw));
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null) return [];
  const ranked = (parsed as { ranked?: unknown }).ranked;
  if (!Array.isArray(ranked)) return [];

  const seen = new Set<number>();
  const result: number[] = [];
  for (const value of ranked) {
    if (typeof value !== "number" || !Number.isInteger(value)) continue;
    if (value < 0 || value >= candidateCount) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

const RESPONSE_RULES =
  `Response rules:
- Imagine a specific kind of person (an enthusiast, a skeptic, someone with a bad experience) and write what they would say out loud to a friend, not what they would write in an essay.
- STRICT MAX 8 WORDS per response. Cut mercilessly.
- Never start with "I think", "I feel", "I believe", "In my opinion", or "Honestly" — jump straight to the point.
- Never end with filler qualifiers like "to me" or "for me".
- Never use "everyone", "most people", or "we" — speak only for yourself.
- Each response must directly answer the topic and be a complete thought, never trailing off with ellipses.
- Cover a range of viewpoints, including at least one unpopular or minority opinion that a real person might genuinely hold.
- Randomize the order of the responses; do not always put the unpopular one last.
- No quotation marks. No exclamation marks or question marks anywhere, and no punctuation at the end of a response — write plainly even when the opinion is excited (e.g. "Great for quick trips around the city", not "Great! Quick trips, love it!").`;

export function makeTransformPromptFromGGWashArticle(
  article: GGWashArticle,
  provider: LlmProvider,
  persona?: string,
): AiPrompt {
  const personaPrompt = persona ?? getRandomPersona();

  const systemPrompt = personaPrompt +
    ` You write concisely. If the article cannot be turned into a good DC discussion, your entire response must be only the word "${LLM_ERROR_SENTINEL}" — no topic, no responses, nothing else.`;

  let userPrompt =
    `Convert this Greater Greater Washington article into a Heard discussion for a Washington, DC audience: one topic question plus a few short response statements representing distinct opinions people might hold.

Article title: "${article.title}"
Article body: "${article.body}"

BEFORE DOING ANYTHING ELSE — if any condition below is met, respond with only the word "${LLM_ERROR_SENTINEL}" and stop. Do not generate a topic or responses:
- The article is benign or purely informational with nothing to debate (a staff or hiring announcement, an intern introduction, a routine "breaks ground" or project-update notice, an award notice, an event listing, or a link-roundup column such as "Breakfast links" or "National links", or any other multi-link roundup).
- The article is a call to action that urges readers to take a specific civic action — vote for or endorse a particular candidate or slate, sign a petition, attend a rally or meeting, donate, or contact officials. (An op-ed that merely argues a position or proposes a policy is NOT a call to action — that is good debate material; keep it.)
- The article is a game, puzzle, quiz, crossword, or word game.
- The article is primarily a photo, photo essay, gallery, or "Photo Friday"-style image post with little discussable text.
- The article is not focused on the District of Columbia itself — it is primarily about Virginia or Maryland, or it mixes DC with the Maryland or Virginia suburbs.
- The article frames marginalized or vulnerable groups in opposition to each other.
- The article dismisses, minimizes, or misrepresents a recognized medical or psychological condition.

Topic rules:
- One engaging question that invites a range of opinions about the article's subject. News, a named person, a policy, an election, or a new technology are all fine subjects.
- The topic may be specific and timely, and may be phrased directly (for example "Should Waymo expand its robotaxis in DC?" or "What do you make of the candidates in the DC mayoral race?"). It does NOT need to be evergreen, open-ended, or experience-based.
- Keep the topic about DC.
- The topic is a question: end it with a single question mark. (The no-punctuation rule below applies only to the responses, never to the topic.)

${RESPONSE_RULES}

Format: no blank lines, topic on line 1, then exactly 3 responses on the following lines, nothing else.`;

  if (provider === "gemini" || provider === "anthropic") {
    userPrompt += `

CRITICAL REMINDERS — you MUST follow these exactly:
- Produce EXACTLY 3 response statements, each on its own line after the topic question.
- Each response MUST be a STRICT MAX of 8 words.
- Each RESPONSE must have NO exclamation marks, question marks, end-of-line punctuation, or quotation marks. (The topic line is a question and MUST keep its question mark — this rule is only about the responses.)
- No preambles like "I think" or "Honestly" — state the opinion directly.
- No blank lines between the topic and the responses or between responses.`;
  }

  return { systemPrompt, userPrompt };
}
