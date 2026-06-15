/**
 * GGWash importer — DRY RUN harness (no publishing).
 *
 * Runs the real two-stage flow against the live feed + LLM and writes a Markdown
 * report, but never calls createRoom/saveStatement, so nothing is published and
 * no DB is touched.
 *
 * It imports the REAL prompt + scraper code from the server, so editing
 *   ../../src/supabase/functions/server/ggwash-prompt-utils.ts
 * and re-running shows exactly how a prompt change affects each stage.
 *
 * Run (from the repo root):
 *   deno run -A --node-modules-dir=auto --no-lock research/ggwash-importer/dry-run.ts
 *
 * Keys are read from the repo-root .env (research/ggwash-importer/.env overrides
 * it). Without a key it still fetches the feed and renders the articles, images,
 * and the exact prompts — only the LLM responses are blank.
 *
 * Knobs (env, settable in .env):
 *   GEMINI_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY  — provider key
 *   LLM_PROVIDER          — gemini (default) | anthropic | openai
 *   GGWASH_REFRESH=1      — re-fetch the live feed (otherwise reuse the cache)
 *   GGWASH_PERSONA="..."  — pin the transform persona (default: random per call)
 *   GGWASH_TRANSFORM_LIMIT=N — transform only the top N ranked (default: all)
 *   GGWASH_SKIP_UNSELECTED=1 — skip transforming the candidates Stage 1 didn't rank
 */
import { fromFileUrl } from "jsr:@std/path";
import { load } from "jsr:@std/dotenv";
import process from "node:process";

import {
  fetchGGWashArticles,
  isRoundupTitle,
} from "../../src/supabase/functions/server/ggwash-scraper-utils.ts";
import {
  LLM_ERROR_SENTINEL,
  makeGGWashSelectionPrompt,
  makeTransformPromptFromGGWashArticle,
  parseSelectionResponse,
  SELECTION_SNIPPET_CHARS,
} from "../../src/supabase/functions/server/ggwash-prompt-utils.ts";
import {
  createLlmClient,
  getLlmProvider,
  LlmProvider,
} from "../../src/supabase/functions/server/llm-provider.ts";
import { LlmClient } from "../../src/supabase/functions/server/llm-client.ts";
import { getRandomPersona } from "../../src/supabase/functions/server/personas.tsx";
import { AiPrompt, GGWashArticle } from "../../src/supabase/functions/server/types.tsx";

// --- statement-count gate, mirrored from ggwash-import-service.ts -----------
const MIN_STATEMENTS = 2;
const MAX_STATEMENTS = 3;

function parseTransform(
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
  // Mirrors ggwash-import-service.ts: force a single "?" on the topic, strip
  // trailing punctuation off responses.
  return {
    topic: stripTrailingPunctuation(topic) + "?",
    statements: statements.map(stripTrailingPunctuation),
  };
}

function stripTrailingPunctuation(text: string): string {
  return text.replace(/[.!?]+$/, "").trim();
}

// --- paths + env ------------------------------------------------------------
const here = (rel: string) => fromFileUrl(new URL(rel, import.meta.url));
const FEED_CACHE = here("./dry-run-feed.json");
const REPORT = here("./dry-run-report.md");

// Load env keys. The research-folder .env (if present) takes precedence; the
// repo-root .env supplies the rest. std dotenv does not overwrite already-set
// vars, so loading local first gives it precedence over root.
for (const envPath of [here("./.env"), here("../../.env")]) {
  try {
    await load({ envPath, export: true });
  } catch {
    // missing/unreadable .env — ignore and try the next.
  }
}
// Disable the LLM client's fire-and-forget DB usage logging.
process.env.NODE_ENV = "test";

const refreshFeed = process.env.GGWASH_REFRESH === "1";
const pinnedPersona = process.env.GGWASH_PERSONA?.trim() || undefined;
const transformLimitRaw = Number(process.env.GGWASH_TRANSFORM_LIMIT);
const PROVIDER_MODEL: Record<LlmProvider, string> = {
  gemini: "gemini-2.5-flash",
  anthropic: "(see anthropic-client.ts)",
  openai: "(see openai-client.ts)",
};
// Display-only mirrors of the publish constants in ggwash-import-service.ts.
const POST_SUBHEARD = "washington-dc";
const POST_AUTHOR = "enrichment-service";

// --- captured shapes for the report -----------------------------------------
interface TransformCapture {
  candidateIndex: number;
  selectionRank: number | null; // Stage 1 rank position, or null if not selected
  article: GGWashArticle;
  persona: string;
  prompt: AiPrompt;
  raw: string | null;
  parsed: { topic: string; statements: string[] } | null;
  reason: string;
  wouldPublish: boolean;
}

interface ReportData {
  feedSource: string;
  provider: LlmProvider;
  clientError: string | null;
  articles: GGWashArticle[];
  roundups: GGWashArticle[];
  candidates: GGWashArticle[];
  selectionPrompt: AiPrompt;
  rawSelection: string | null;
  ranked: number[];
  transforms: TransformCapture[];
}

async function main() {
  // 1. Feed: reuse the cache so prompt tweaks compare against identical inputs.
  let articles: GGWashArticle[] | undefined;
  let feedSource = "cache";
  if (!refreshFeed) {
    try {
      articles = JSON.parse(await Deno.readTextFile(FEED_CACHE));
    } catch {
      articles = undefined;
    }
  }
  if (!articles) {
    console.log("Fetching live GGWash feed...");
    articles = await fetchGGWashArticles();
    await Deno.writeTextFile(FEED_CACHE, JSON.stringify(articles, null, 2));
    feedSource = "live";
  } else {
    console.log(`Using cached feed (${articles.length} articles). GGWASH_REFRESH=1 to refetch.`);
  }

  // 2. Partition exactly like recordAndCollectCandidates (minus the KV dedup,
  //    which a dry run has no store for): roundups auto-rejected, rest eligible.
  const roundups = articles.filter((a) => isRoundupTitle(a.title));
  const candidates = articles.filter((a) => !isRoundupTitle(a.title));

  // 3. LLM client (optional — render prompts even with no key).
  let provider: LlmProvider = "gemini";
  try {
    provider = getLlmProvider();
  } catch { /* keep default for display */ }
  let client: LlmClient | null = null;
  let clientError: string | null = null;
  try {
    client = createLlmClient(provider);
  } catch (e) {
    clientError = e instanceof Error ? e.message : String(e);
    console.warn(`\n⚠  No LLM client: ${clientError}\n   Rendering feed + prompts only.\n`);
  }

  // 4. Stage 1 — selection.
  const selectionPrompt = makeGGWashSelectionPrompt(candidates);
  let rawSelection: string | null = null;
  let ranked: number[] = [];
  if (client) {
    console.log("Stage 1: selecting...");
    try {
      rawSelection = await client.completeJson(selectionPrompt, {
        endpoint: "dryrun-ggwash-select",
      });
      ranked = parseSelectionResponse(rawSelection, candidates.length);
      console.log(`  ranked candidate indices: [${ranked.join(", ")}]`);
    } catch (e) {
      console.warn(`  selection call failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  // 5. Stage 2 — transform. The real flow only transforms ranked candidates and
  //    stops at the first valid one; we additionally transform the candidates
  //    Stage 1 did NOT rank, purely to show what they would have become
  //    (disable with GGWASH_SKIP_UNSELECTED=1).
  const rankedLimit = Number.isFinite(transformLimitRaw) && transformLimitRaw > 0
    ? transformLimitRaw
    : ranked.length;

  const transformArticle = async (
    candidateIndex: number,
    selectionRank: number | null,
    label: string,
  ): Promise<TransformCapture> => {
    const article = candidates[candidateIndex];
    const persona = pinnedPersona ?? getRandomPersona();
    const prompt = makeTransformPromptFromGGWashArticle(article, provider, persona);
    console.log(`Stage 2 ${label}: "${article.title.slice(0, 60)}"`);
    let raw: string | null = null;
    let callError: string | null = null;
    if (client) {
      try {
        raw = await client.complete(prompt, { endpoint: "dryrun-ggwash-transform" });
      } catch (e) {
        callError = e instanceof Error ? e.message : String(e);
        console.warn(`  transform call failed: ${callError}`);
      }
    }
    const parsed = raw ? parseTransform(raw) : null;
    return {
      candidateIndex,
      selectionRank,
      article,
      persona,
      prompt,
      raw,
      parsed,
      reason: callError
        ? `LLM call failed — ${callError}`
        : !raw
        ? "no LLM key — not transformed"
        : parsed
        ? "ok"
        : raw.trim() === LLM_ERROR_SENTINEL
        ? 'LLM returned the "Error" sentinel (deemed unsuitable)'
        : "invalid output (empty topic or wrong statement count)",
      wouldPublish: false,
    };
  };

  const transforms: TransformCapture[] = [];
  // 5a. Ranked candidates (real flow): first valid one is the would-be post.
  let publishedYet = false;
  for (let pos = 0; pos < ranked.length && pos < rankedLimit; pos++) {
    const cap = await transformArticle(
      ranked[pos],
      pos,
      `ranked ${pos + 1}/${Math.min(ranked.length, rankedLimit)}`,
    );
    if (cap.parsed && !publishedYet) {
      cap.wouldPublish = true;
      publishedYet = true;
    }
    transforms.push(cap);
  }
  // 5b. Candidates Stage 1 did not rank (exploratory; never published).
  const includeUnselected = client !== null &&
    process.env.GGWASH_SKIP_UNSELECTED !== "1";
  if (includeUnselected) {
    const rankedSet = new Set(ranked);
    const unselected = candidates
      .map((_, ci) => ci)
      .filter((ci) => !rankedSet.has(ci));
    for (let i = 0; i < unselected.length; i++) {
      transforms.push(
        await transformArticle(unselected[i], null, `unselected ${i + 1}/${unselected.length}`),
      );
    }
  }

  // 6. Render.
  const md = renderMarkdown({
    feedSource,
    provider,
    clientError,
    articles,
    roundups,
    candidates,
    selectionPrompt,
    rawSelection,
    ranked,
    transforms,
  });
  await Deno.writeTextFile(REPORT, md);
  console.log(`\n✓ Report written: ${REPORT}`);
  if (clientError) {
    console.log("  (LLM responses are blank — add a key to .env and re-run.)");
  }
}

// --- Markdown rendering -----------------------------------------------------
// Escape the few characters that would break inline Markdown (headings, list
// items, table cells, blockquotes). Code-fenced content is left untouched.
function esc(s: string): string {
  return s.replace(/([\\`*_|<>[\]])/g, "\\$1");
}

// 4-tilde fence so any backticks (or ``` runs) inside prompts/responses are safe.
function fence(s: string): string {
  return "~~~~\n" + s.replace(/\r/g, "") + "\n~~~~";
}

function image(url: string | undefined): string {
  if (!url) return "_no image extracted from the article HTML_";
  // Angle-bracket form tolerates the %20 the scraper leaves in some URLs; the
  // backtick line keeps the URL visible even if the hotlink is blocked.
  return `![image](<${url}>)\n\n\`${url}\``;
}

function renderMarkdown(d: ReportData): string {
  const out: string[] = [];
  const p = (s = "") => out.push(s);
  const now = new Date().toISOString();

  p(`# GGWash importer — dry run`);
  p();
  p(`_No posts were published. Generated ${now}._`);
  p();
  if (d.clientError) {
    p(`> ⚠ **No LLM key** (${esc(d.clientError)}). Articles, images, and prompts are shown; LLM responses are blank. Add a key to \`research/ggwash-importer/.env\` or the repo-root \`.env\` and re-run.`);
    p();
  }

  out.push(...summarySection(d));
  out.push(...articlesSection(d));
  out.push(...appendixSection(d));

  return out.join("\n");
}

function summarySection(d: ReportData): string[] {
  const out: string[] = [];
  const p = (s = "") => out.push(s);
  const winner = d.transforms.find((t) => t.wouldPublish);
  const winnerIdx = winner
    ? d.articles.findIndex((a) => a.guid === winner.article.guid)
    : -1;

  p(`## Summary`);
  p();
  p(`| field | value |`);
  p(`| --- | --- |`);
  p(`| provider | ${d.provider} · ${PROVIDER_MODEL[d.provider]} |`);
  p(`| feed source | ${d.feedSource === "live" ? "live fetch" : "cached"} |`);
  p(`| articles fetched | ${d.articles.length} |`);
  p(`| roundups auto-rejected | ${d.roundups.length} |`);
  p(`| candidates | ${d.candidates.length} |`);
  p(`| ranked by Stage 1 | ${d.ranked.length} |`);
  p(`| would publish | ${winner ? 1 : 0} |`);
  p();
  if (winner) {
    p(`**🟢 Would publish:** #${winnerIdx} · ${esc(winner.article.title)} → community \`${POST_SUBHEARD}\`, author \`${POST_AUTHOR}\`, open one week.`);
  } else {
    p(`_Nothing would be published this run._`);
  }
  p();
  p(`The shared prompts (the transform prompt is identical for every article; the Stage 1 selection call ranks them all together) are in the **Appendix** at the bottom — each article row below shows only its own inputs and results.`);
  p();

  const posts = d.transforms.filter((t) => t.parsed);
  if (posts.length) {
    p(`### All generated topics + seed statements (${posts.length})`);
    p();
    p(`🟢 would be posted this run · ☑️ valid but ranked lower · ⚪ valid but not selected by Stage 1`);
    p();
    const ordered = [...posts].sort(
      (a, b) => (b.wouldPublish ? 1 : 0) - (a.wouldPublish ? 1 : 0),
    );
    for (const t of ordered) {
      const mark = t.wouldPublish ? "🟢" : t.selectionRank !== null ? "☑️" : "⚪";
      p(`**${mark} ${esc(t.parsed!.topic)}**${t.wouldPublish ? " — _would be posted_" : ""}`);
      t.parsed!.statements.forEach((s) => p(`- ${esc(s)}`));
      p();
    }
  }
  return out;
}

// One self-contained row per article: everything that happened to it, no shared
// boilerplate repeated.
function articlesSection(d: ReportData): string[] {
  const out: string[] = [];
  out.push(`## Articles — one row per article (${d.articles.length})`, ``);
  const candIndex = new Map(d.candidates.map((a, i) => [a.guid, i]));
  const txByGuid = new Map(d.transforms.map((t) => [t.article.guid, t]));
  d.articles.forEach((a, feedIdx) => {
    out.push(...articleCard(a, feedIdx, candIndex.get(a.guid), txByGuid.get(a.guid)));
  });
  return out;
}

function articleCard(
  a: GGWashArticle,
  feedIdx: number,
  candIdx: number | undefined,
  t: TransformCapture | undefined,
): string[] {
  const out: string[] = [];
  const p = (s = "") => out.push(s);
  const isRoundup = isRoundupTitle(a.title);

  let outcome: string;
  if (isRoundup) {
    outcome = "🚫 auto-rejected — link-roundup title, filtered before the LLM";
  } else if (!t) {
    outcome = "— not transformed";
  } else if (t.wouldPublish) {
    outcome = "🟢 WOULD BE PUBLISHED — the post that goes live this run";
  } else if (t.parsed) {
    outcome = t.selectionRank !== null
      ? `☑️ valid topic, ranked #${t.selectionRank + 1} but not first — not chosen this run`
      : "⚪ valid topic, but Stage 1 did not select it — would not publish";
  } else {
    outcome = `🚫 transform returned no post — ${esc(t.reason)}`;
  }

  p(`### ${feedIdx}. ${esc(a.title)}`);
  p();
  p(`**${outcome}**`);
  p();
  const meta = [
    new Date(a.publishedAt).toUTCString(),
    `body ${a.body.length} chars`,
    isRoundup ? "roundup (not a candidate)" : `candidate #${candIdx}`,
  ];
  if (t) {
    meta.push(
      t.selectionRank !== null
        ? `Stage 1 rank #${t.selectionRank + 1}`
        : "not ranked by Stage 1",
    );
    meta.push(`persona: ${esc(t.persona)}`);
  }
  p(meta.join(" · "));
  p();
  p(`[article link](<${a.url}>)`);
  p();
  p(image(a.imageUrl));
  p();

  if (!isRoundup) {
    const snippet = a.body.slice(0, SELECTION_SNIPPET_CHARS).replace(/\s+/g, " ").trim();
    p(`**Snippet Stage 1 ranked on (first ${SELECTION_SNIPPET_CHARS} chars):**`);
    p(`> ${esc(snippet) || "_(empty)_"}`);
    p();
  }

  if (t) {
    p(`**Full body sent to the transform (${a.body.length} chars):**`);
    p(fence(a.body));
    p();
    p(`**Raw transform response:**`);
    p(t.raw === null ? "_No LLM key — transform not run._" : fence(t.raw));
    p();
    if (t.parsed) {
      p(`**Resulting Heard post:**`);
      p(`> **${esc(t.parsed.topic)}**`);
      p(`>`);
      t.parsed.statements.forEach((s) => p(`> - ${esc(s)}`));
      p();
    }
  }
  p(`---`);
  p();
  return out;
}

// Shared prompts shown once (identical across articles), so the per-article rows
// stay focused on each article's own inputs and results.
function appendixSection(d: ReportData): string[] {
  const out: string[] = [];
  const p = (s = "") => out.push(s);
  p(`## Appendix — shared prompts`);
  p();

  p(`### Transform prompt (same for every article — only «PERSONA», «TITLE», «BODY» change)`);
  p();
  const template = makeTransformPromptFromGGWashArticle(
    { title: "«ARTICLE TITLE»", body: "«ARTICLE BODY»", url: "", guid: "", publishedAt: 0 },
    d.provider,
    "«PERSONA»",
  );
  p(`**System:**`);
  p(fence(template.systemPrompt));
  p();
  p(`**User:**`);
  p(fence(template.userPrompt));
  p();

  p(`### Stage 1 selection call (ranks all candidates together)`);
  p();
  p(`**System:**`);
  p(fence(d.selectionPrompt.systemPrompt));
  p();
  p(`**User:**`);
  p(fence(d.selectionPrompt.userPrompt));
  p();
  p(`**Raw response:**`);
  if (d.rawSelection === null) {
    p(`_No LLM key — selection not run._`);
  } else {
    p(fence(d.rawSelection));
    p();
    p(`**Parsed ranking:**`);
    if (d.ranked.length === 0) {
      p(`_(none qualified)_`);
    } else {
      d.ranked.forEach((ci, pos) =>
        p(`${pos + 1}. candidate #${ci} — ${esc(d.candidates[ci]?.title ?? "?")}`)
      );
    }
  }
  p();
  return out;
}

await main();
