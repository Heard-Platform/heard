import { fetchGGWashArticles, isRoundupTitle } from "./ggwash-scraper-utils.ts";
import {
  LLM_ERROR_SENTINEL,
  makeGGWashSelectionPrompt,
  makeTransformPromptFromGGWashArticle,
  parseSelectionResponse,
} from "./ggwash-prompt-utils.ts";
import { EnrichmentService } from "./enrichment-service.ts";
import { GGWashArticle, ScrapedItem } from "./types.tsx";
import { getScrapedItem, saveScrapedItem } from "./scraped-items-utils.ts";

const SELECT_ENDPOINT = "ggwash-select";
const TRANSFORM_ENDPOINT = "ggwash-transform";
const TARGET_POSTS_PER_RUN = 1;
const DEFAULT_SUBHEARD = "washington-dc";
const MIN_STATEMENTS = 2;
const MAX_STATEMENTS = 3;
const STORE_EXCERPT_CHARS = 2000;
const SCRAPE_SOURCE = "ggwash";

export interface GGWashRunResult {
  posted: number;
  considered: number;
  skipped: number;
}

export class GGWashImporter extends EnrichmentService {
  protected author = "ggwash-importer";
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

  private async recordAndCollectCandidates(
    articles: GGWashArticle[],
  ): Promise<GGWashArticle[]> {
    const candidates: GGWashArticle[] = [];
    for (const article of articles) {
      const existing = await getScrapedItem(SCRAPE_SOURCE, article.guid);
      if (existing) {
        if (existing.status === "scraped") candidates.push(article);
        continue;
      }
      if (isRoundupTitle(article.title)) {
        await saveScrapedItem(
          autoRejectedRecord(article, "auto-excluded: links roundup"),
        );
        continue;
      }
      await saveScrapedItem(toScrapedRecord(article));
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

  private async attemptPublish(
    article: GGWashArticle,
    rank: number,
  ): Promise<boolean> {
    const record = (await getScrapedItem(SCRAPE_SOURCE, article.guid))!;
    // Mark as attempted BEFORE the transform, so a crash or double-fire can never re-post this article (at-most-once).
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

    const roomId = await this.publishRoom(parsed.topic, parsed.statements, {
      subHeard: DEFAULT_SUBHEARD,
      imageUrl: article.imageUrl,
    });
    await recordPublished(record, parsed, roomId);

    logSuccess(article, parsed.topic, parsed.statements);
    return true;
  }


}

function autoRejectedRecord(
  article: GGWashArticle,
  error: string,
): ScrapedItem {
  return {
    ...toScrapedRecord(article),
    status: "rejected",
    error,
    decidedAt: Date.now(),
  };
}

function toScrapedRecord({ body, ...rest }: GGWashArticle): ScrapedItem {
  return {
    ...rest,
    bodyExcerpt: body.slice(0, STORE_EXCERPT_CHARS),
    source: SCRAPE_SOURCE,
    scrapedAt: Date.now(),
    status: "scraped",
  };
}

async function markAttempting(
  record: ScrapedItem,
  rank: number,
): Promise<void> {
  record.status = "attempting";
  record.rank = rank;
  await saveScrapedItem(record);
}

async function recordRejection(
  record: ScrapedItem,
  aiResponse: string,
): Promise<void> {
  record.status = "rejected";
  record.error = aiResponse.trim() === LLM_ERROR_SENTINEL
    ? "transform returned Error"
    : "invalid transform output";
  record.decidedAt = Date.now();
  await saveScrapedItem(record);
}

async function recordPublished(
  record: ScrapedItem,
  parsed: { topic: string; statements: string[] },
  roomId: string,
): Promise<void> {
  record.status = "published";
  record.generatedTopic = parsed.topic;
  record.generatedStatements = parsed.statements;
  record.publishedRoomId = roomId;
  record.decidedAt = Date.now();
  await saveScrapedItem(record);
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
  return {
    topic: toQuestion(topic),
    statements: statements.map(stripTrailingPunctuation),
  };
}

function toQuestion(text: string): string {
  return stripTrailingPunctuation(text) + "?";
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
