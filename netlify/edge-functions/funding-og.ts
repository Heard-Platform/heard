// Netlify Edge Functions run in a Deno runtime — the Deno global below is
// valid at deploy time but unknown to the project tsconfig.
declare const Deno: { env: { get(key: string): string | undefined } };

type Context = { next(): Promise<Response> };

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

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => ua.includes(pattern));
}

const TITLE = "Support Heard";
const DESCRIPTION =
  "Help us raise $5,000 to keep Heard running — a community platform for honest, structured local conversation.";
const URL = "https://heard.vote/fund";
const IMAGE = "https://heard.vote/monkey.png";

const OG_HEAD = `
    <title>${TITLE} | Heard</title>
    <meta name="description" content="${DESCRIPTION}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${URL}" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESCRIPTION}" />
    <meta property="og:image" content="${IMAGE}" />
    <meta property="og:site_name" content="Heard" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESCRIPTION}" />
    <meta name="twitter:image" content="${IMAGE}" />`.trim();

export default async function handler(request: Request, context: Context): Promise<Response> {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!isCrawler(userAgent)) return context.next();

  try {
    const spaResponse = await context.next();
    const spaHtml = await spaResponse.text();

    const injected = spaHtml
      .replace(/<title>.*?<\/title>/, "")
      .replace("</head>", `  ${OG_HEAD}\n  </head>`);

    return new Response(injected, {
      status: spaResponse.status,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return context.next();
  }
}
