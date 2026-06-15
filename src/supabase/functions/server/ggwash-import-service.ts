import { fetchGGWashArticles, isRoundupTitle } from "./ggwash-scraper-utils.ts";
import {
  LLM_ERROR_SENTINEL,
  makeGGWashSelectionPrompt,
  makeTransformPromptFromGGWashArticle,
  parseSelectionResponse,
} from "./ggwash-prompt-utils.ts";
import { EnrichmentService } from "./enrichment-service.ts";
import { GGWashArticle, GGWashArticleRecord } from "./types.tsx";
import {
  createRoom,
  getGGWashArticle,
  saveGGWashArticle,
  saveStatement,
} from "./kv-utils.tsx";
import { createNewRoomData } from "./room-utils.ts";
import { ONE_WEEK_MS } from "./time-utils.ts";
import { generateId } from "./utils.tsx";

const SELECT_ENDPOINT = "ggwash-select";
const TRANSFORM_ENDPOINT = "ggwash-transform";
const TARGET_POSTS_PER_RUN = 1;
const DEFAULT_SUBHEARD = "washington-dc";
const IMPORTER_AUTHOR = "enrichment-service";
const MIN_STATEMENTS = 2;
const MAX_STATEMENTS = 3;
const STORE_EXCERPT_CHARS = 2000;

export interface GGWashRunResult {
  posted: number;
  considered: number;
  skipped: number;
}

export class GGWashImporter extends EnrichmentService {
  async runOnce(): Promise<GGWashRunResult> {
    const articles = await fetchGGWashArticles();
    const candidates = await this.recordAndCollectCandidates(articles);
    if (candidates.length === 0) {
      return { posted: 0, considered: 0, skipped: 0 };
    }

    const ranked = await this.selectRanked(candidates);

    let posted = 0;
    let skipped = 0;
    for (const index of ranked) {
      if (posted >= TARGET_POSTS_PER_RUN) break;
      const published = await this.attemptPublish(candidates[index], index);
      if (published) posted++;
      else skipped++;
    }

    return { posted, considered: candidates.length, skipped };
  }

  // Stores a record for every freshly scraped article (for later review of the
  // LLM's choices) and returns the ones still eligible for selection: anything
  // never attempted, i.e. status "scraped".
  private async recordAndCollectCandidates(
    articles: GGWashArticle[],
  ): Promise<GGWashArticle[]> {
    const candidates: GGWashArticle[] = [];
    for (const article of articles) {
      const existing = await getGGWashArticle(article.guid);
      if (existing) {
        if (existing.status === "scraped") candidates.push(article);
        continue;
      }
      if (isRoundupTitle(article.title)) {
        await saveGGWashArticle(
          autoRejectedRecord(article, "auto-excluded: links roundup"),
        );
        continue;
      }
      await saveGGWashArticle(toScrapedRecord(article));
      candidates.push(article);
    }
    return candidates;
  }

  private async selectRanked(candidates: GGWashArticle[]): Promise<number[]> {
    const prompt = makeGGWashSelectionPrompt(candidates);
    const raw = await this.aiClient.completeJson(prompt, {
      endpoint: SELECT_ENDPOINT,
    });
    return parseSelectionResponse(raw, candidates.length);
  }

  // Marks the article processed BEFORE the transform call (at-most-once: a
  // crash or double-fire can never re-attempt it), then transforms and, on
  // success, publishes a room with the article's image hotlinked.
  private async attemptPublish(
    article: GGWashArticle,
    rank: number,
  ): Promise<boolean> {
    // Guaranteed present: recordAndCollectCandidates saved a record for every
    // candidate it returned.
    const record = (await getGGWashArticle(article.guid))!;
    await markAttempting(record, rank);

    const prompt = makeTransformPromptFromGGWashArticle(article, this.provider);
    const aiResponse = await this.aiClient.complete(prompt, {
      endpoint: TRANSFORM_ENDPOINT,
    });

    const parsed = parseTransform(aiResponse);
    if (!parsed) {
      await recordRejection(record, aiResponse);
      return false;
    }

    const roomId = await this.publish(article, parsed.topic, parsed.statements);
    await recordPublished(record, parsed, roomId);

    logSuccess(article, parsed.topic, parsed.statements);
    return true;
  }

  private async publish(
    article: GGWashArticle,
    topic: string,
    statements: string[],
  ): Promise<string> {
    const room = createNewRoomData({
      id: generateId(),
      topic,
      participants: [],
      hostId: IMPORTER_AUTHOR,
      subHeard: DEFAULT_SUBHEARD,
      endTime: Date.now() + ONE_WEEK_MS,
      allowAnonymous: true,
      imageUrl: article.imageUrl,
    });

    await createRoom(room);

    await Promise.all(
      statements.map((text) =>
        saveStatement({
          id: generateId(),
          text,
          author: IMPORTER_AUTHOR,
          agrees: 0,
          disagrees: 0,
          passes: 0,
          superAgrees: 0,
          roomId: room.id,
          timestamp: Date.now(),
          round: 1,
          voters: {},
        })
      ),
    );

    return room.id;
  }
}

function autoRejectedRecord(
  article: GGWashArticle,
  error: string,
): GGWashArticleRecord {
  return {
    ...toScrapedRecord(article),
    status: "rejected",
    error,
    decidedAt: Date.now(),
  };
}

function toScrapedRecord(article: GGWashArticle): GGWashArticleRecord {
  return {
    guid: article.guid,
    title: article.title,
    url: article.url,
    imageUrl: article.imageUrl,
    publishedAt: article.publishedAt,
    scrapedAt: Date.now(),
    bodyExcerpt: article.body.slice(0, STORE_EXCERPT_CHARS),
    status: "scraped",
  };
}

// Record state transitions (mutate + persist). Marking happens BEFORE the
// transform call so a crash or double-fire can never re-attempt the article.
async function markAttempting(
  record: GGWashArticleRecord,
  rank: number,
): Promise<void> {
  record.status = "attempting";
  record.rank = rank;
  await saveGGWashArticle(record);
}

async function recordRejection(
  record: GGWashArticleRecord,
  aiResponse: string,
): Promise<void> {
  record.status = "rejected";
  record.error = aiResponse.trim() === LLM_ERROR_SENTINEL
    ? "transform returned Error"
    : "invalid transform output";
  record.decidedAt = Date.now();
  await saveGGWashArticle(record);
}

async function recordPublished(
  record: GGWashArticleRecord,
  parsed: { topic: string; statements: string[] },
  roomId: string,
): Promise<void> {
  record.status = "published";
  record.generatedTopic = parsed.topic;
  record.generatedStatements = parsed.statements;
  record.publishedRoomId = roomId;
  record.decidedAt = Date.now();
  await saveGGWashArticle(record);
}

export function parseTransform(
  aiResponse: string,
): { topic: string; statements: string[] } | null {
  if (aiResponse.trim() === LLM_ERROR_SENTINEL) return null;

  const lines = aiResponse
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const topic = lines[0] ?? "";
  const statements = lines.slice(1);
  if (
    topic === "" ||
    statements.length < MIN_STATEMENTS ||
    statements.length > MAX_STATEMENTS
  ) {
    return null;
  }
  // Normalize punctuation deterministically — the LLM is unreliable here. The
  // topic is a question, so force a single trailing "?"; responses carry none.
  return {
    topic: stripTrailingPunctuation(topic) + "?",
    statements: statements.map(stripTrailingPunctuation),
  };
}

function stripTrailingPunctuation(text: string): string {
  return text.replace(/[.!?]+$/, "").trim();
}

function logSuccess(
  article: GGWashArticle,
  topic: string,
  statements: string[],
): void {
  let msg = "Heard convo created from GGWash article:";
  msg += `\nArticle title: ${article.title}`;
  msg += `\nArticle url: ${article.url}`;
  msg += `\nHeard topic: ${topic}`;
  statements.forEach((statement, index) => {
    msg += `\nResponse ${index + 1}: ${statement}`;
  });
  msg += `\n---------------------------------------------`;
  console.debug(msg);
}
