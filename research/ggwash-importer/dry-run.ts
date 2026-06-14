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
  return { topic, statements };
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

// --- captured shape for the report -----------------------------------------
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
    rawSelection = await client.completeJson(selectionPrompt, {
      endpoint: "dryrun-ggwash-select",
    });
    ranked = parseSelectionResponse(rawSelection, candidates.length);
    console.log(`  ranked candidate indices: [${ranked.join(", ")}]`);
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
    const raw = client
      ? await client.complete(prompt, { endpoint: "dryrun-ggwash-transform" })
      : null;
    const parsed = raw ? parseTransform(raw) : null;
    return {
      candidateIndex,
      selectionRank,
      article,
      persona,
      prompt,
      raw,
      parsed,
      reason: !raw
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

function renderMarkdown(d: {
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
}): string {
  const now = new Date().toISOString();
  const wouldPublish = d.transforms.find((t) => t.wouldPublish);
  const out: string[] = [];
  const p = (s = "") => out.push(s);

  p(`# GGWash importer — dry run`);
  p();
  p(`_No posts were published. Generated ${now}._`);
  p();
  if (d.clientError) {
    p(`> ⚠ **No LLM key** (${esc(d.clientError)}). Feed, images, and prompts are shown; LLM responses are blank. Add a key to \`research/ggwash-importer/.env\` or the repo-root \`.env\` and re-run.`);
    p();
  }

  p(`## Summary`);
  p();
  p(`| field | value |`);
  p(`| --- | --- |`);
  p(`| provider | ${d.provider} · ${PROVIDER_MODEL[d.provider]} |`);
  p(`| feed source | ${d.feedSource === "live" ? "live fetch" : "cached"} |`);
  p(`| articles fetched | ${d.articles.length} |`);
  p(`| roundups auto-rejected | ${d.roundups.length} |`);
  p(`| candidates | ${d.candidates.length} |`);
  p(`| ranked by LLM | ${d.ranked.length} |`);
  p(`| would publish | ${wouldPublish ? 1 : 0} |`);
  p();

  // Headline — the exact Heard post that would be created this run.
  p(`## Would-be-published Heard post`);
  p();
  if (!wouldPublish || !wouldPublish.parsed) {
    p(`_Nothing would be published this run — no ranked candidate passed the transform gate._`);
    p();
  } else {
    p(`The topic and seed statements that would be persisted this run — the first ranked candidate that passed the transform gate. Community \`${POST_SUBHEARD}\`, author \`${POST_AUTHOR}\`, open one week, image hotlinked from the source article.`);
    p();
    p(`**Source article:** [${esc(wouldPublish.article.title)}](<${wouldPublish.article.url}>)`);
    p();
    if (wouldPublish.article.imageUrl) {
      p(image(wouldPublish.article.imageUrl));
      p();
    }
    p(`**Topic:**`);
    p();
    p(fence(wouldPublish.parsed.topic));
    p();
    p(`**Seed statements (${wouldPublish.parsed.statements.length}):**`);
    p();
    p(fence(wouldPublish.parsed.statements.join("\n")));
    p();
  }

  // Stage 0 — feed
  p(`## Stage 0 · Feed (${d.articles.length} articles)`);
  p();
  p(`Each article shows the extracted image, the title, and the ${SELECTION_SNIPPET_CHARS}-char snippet the selection prompt sees. "Breakfast links" roundups are filtered deterministically before the LLM; the full body text appears inside each transform prompt in Stage 2.`);
  p();
  const candIndexByGuid = new Map(d.candidates.map((a, i) => [a.guid, i]));
  for (const a of d.articles) {
    const cIdx = candIndexByGuid.get(a.guid);
    const disposition = isRoundupTitle(a.title)
      ? `🚫 auto-rejected · Breakfast links roundup`
      : `✅ candidate · selection #${cIdx}`;
    const snippet = a.body.slice(0, SELECTION_SNIPPET_CHARS).replace(/\s+/g, " ").trim();
    p(`### ${esc(a.title)}`);
    p();
    p(`${disposition}  `);
    p(`${new Date(a.publishedAt).toUTCString()} · body ${a.body.length} chars · [article link](<${a.url}>)`);
    p();
    p(image(a.imageUrl));
    p();
    p(`**Selection snippet (first ${SELECTION_SNIPPET_CHARS} chars):**`);
    p();
    p(`> ${esc(snippet) || "_(empty)_"}`);
    p();
  }

  // Stage 1 — selection
  p(`## Stage 1 · Selection`);
  p();
  p(`**Prompt — system:**`);
  p();
  p(fence(d.selectionPrompt.systemPrompt));
  p();
  p(`**Prompt — user:**`);
  p();
  p(fence(d.selectionPrompt.userPrompt));
  p();
  p(`**Raw LLM response:**`);
  p();
  if (d.rawSelection === null) {
    p(`_No LLM key — selection not run._`);
  } else {
    p(fence(d.rawSelection));
    p();
    p(`**Parsed ranking:**`);
    p();
    if (d.ranked.length === 0) {
      p(`_(none qualified)_`);
    } else {
      d.ranked.forEach((ci, pos) =>
        p(`${pos + 1}. candidate ${ci} — ${esc(d.candidates[ci]?.title ?? "?")}`)
      );
    }
  }
  p();

  // Stage 2 — transforms, as a shared card renderer used by both groups.
  const card = (t: TransformCapture) => {
    const isRanked = t.selectionRank !== null;
    const status = isRanked
      ? (t.wouldPublish
        ? `🟢 **would be published** (real run stops here)`
        : t.parsed
        ? `☑️ valid · ranked #${t.selectionRank! + 1}, not chosen this run`
        : `🚫 skipped — ${esc(t.reason)}`)
      : (t.parsed
        ? `⚪ not selected by Stage 1 · would not be published`
        : `🚫 not selected by Stage 1 · transform also rejected — ${esc(t.reason)}`);
    p(`#### ${esc(t.article.title)}`);
    p();
    p(`${status}  `);
    p(`candidate ${t.candidateIndex} · ${isRanked ? `rank #${t.selectionRank! + 1}` : "not ranked"} · persona: _${esc(t.persona)}_`);
    p();
    p(`**Transform prompt — system:**`);
    p();
    p(fence(t.prompt.systemPrompt));
    p();
    p(`**Transform prompt — user:**`);
    p();
    p(fence(t.prompt.userPrompt));
    p();
    p(`**Raw LLM response:**`);
    p();
    p(t.raw === null ? `_No LLM key — transform not run._` : fence(t.raw));
    p();
    if (t.parsed) {
      p(`**Resulting Heard post${isRanked ? "" : " (exploratory)"} — topic + seed statements:**`);
      p();
      if (t.article.imageUrl) {
        p(image(t.article.imageUrl));
        p();
      }
      p(`> **${esc(t.parsed.topic)}**`);
      p(`>`);
      t.parsed.statements.forEach((s) => p(`> - ${esc(s)}`));
      p();
    }
    p(`---`);
    p();
  };

  const rankedCaps = d.transforms.filter((t) => t.selectionRank !== null);
  const otherCaps = d.transforms.filter((t) => t.selectionRank === null);

  p(`## Stage 2 · Transform & preview`);
  p();
  p(`### Selected by Stage 1 (ranked) — ${rankedCaps.length}`);
  p();
  p(`The real flow: ranked candidates are transformed in order and the first valid result (🟢) is the post that would go live today.`);
  p();
  if (rankedCaps.length === 0) {
    p(`_Nothing ranked, so nothing was transformed._`);
    p();
  }
  for (const t of rankedCaps) card(t);

  if (otherCaps.length) {
    p(`### Other candidates not selected by Stage 1 — ${otherCaps.length}`);
    p();
    p(`These passed the roundup filter but Stage 1 did **not** rank them, so the real importer would neither transform nor publish them. Shown so you can see the Heard post each non-selected candidate would generate. (Disable with \`GGWASH_SKIP_UNSELECTED=1\`.)`);
    p();
    for (const t of otherCaps) card(t);
  }

  return out.join("\n");
}

await main();
