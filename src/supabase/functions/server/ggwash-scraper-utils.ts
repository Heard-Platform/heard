import { scrapeRssToXml } from "./scraper-utils.ts";
import Parser from "npm:rss-parser";
import { GGWashArticle } from "./types.tsx";

export const GGWASH_RSS_URL = "https://ggwash.org/rss";
const MAX_ARTICLE_CHARS = 8000;
const MAX_ARTICLES = 10;

const ROUNDUP_TITLE_PREFIX = "breakfast links";

export function isRoundupTitle(title: string): boolean {
  return title.trim().toLowerCase().startsWith(ROUNDUP_TITLE_PREFIX);
}

const IMG_SRC_RE = /<img[^>]+\bsrc\s*=\s*["']([^"']+)["']/i;

export function extractFirstImageUrl(html: string): string | undefined {
  const match = IMG_SRC_RE.exec(html);
  const url = match?.[1]?.trim();
  return url && /^https?:\/\//i.test(url) ? url.replace(/ /g, "%20") : undefined;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

interface GGWashFeedItem {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  contentEncoded?: string;
}

export async function fetchGGWashArticles(): Promise<GGWashArticle[]> {
  const parser = new Parser({
    customFields: { item: [["content:encoded", "contentEncoded"]] },
  });
  const xml = await scrapeRssToXml(GGWASH_RSS_URL);
  const feed = (await parser.parseString(xml)) as { items: GGWashFeedItem[] };

  const articles: GGWashArticle[] = [];
  for (const item of feed.items) {
    const html = item.contentEncoded || item.content || "";
    const title = (item.title || "").trim();
    const guid = (item.guid || item.link || "").trim();
    if (!title || !guid) continue;

    const body = (item.contentSnippet?.trim() || stripHtml(html)).slice(
      0,
      MAX_ARTICLE_CHARS,
    );

    articles.push({
      title,
      body,
      url: (item.link || guid).trim(),
      guid,
      imageUrl: extractFirstImageUrl(html),
      publishedAt: new Date(item.isoDate || item.pubDate || "").getTime() || Date.now(),
    });
  }

  return articles.slice(0, MAX_ARTICLES);
}
