export type Context = { next(): Promise<Response> };

const BOT_UA_PATTERNS = [
  "twitterbot",
  "facebookexternalhit",
  "slackbot",
  "whatsapp",
  "linkedinbot",
  "discordbot",
  "telegrambot",
  "facebot",
  "googlebot",
  "bingbot",
];

export function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => ua.includes(pattern));
}

export function injectOgHead(spaHtml: string, headContent: string): string {
  return spaHtml
    .replace(/<title>.*?<\/title>/, "")
    .replace(/<meta[^>]*(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*/gi, "")
    .replace("</head>", `  ${headContent}\n  </head>`);
}

export interface StaticOgMeta {
  title: string;
  description: string;
  url: string;
  image: string;
}

export function buildStaticOgHead({ title, description, url, image }: StaticOgMeta): string {
  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="Heard" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />`.trim();
}

export function createStaticOgHandler(meta: StaticOgMeta) {
  const ogHead = buildStaticOgHead(meta);

  return async function handler(request: Request, context: Context): Promise<Response> {
    const userAgent = request.headers.get("user-agent") ?? "";
    if (!isCrawler(userAgent)) return context.next();

    try {
      const spaResponse = await context.next();
      const spaHtml = await spaResponse.text();

      return new Response(injectOgHead(spaHtml, ogHead), {
        status: spaResponse.status,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch {
      return context.next();
    }
  };
}
