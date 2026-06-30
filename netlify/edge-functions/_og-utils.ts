// Netlify Edge Functions run in a Deno runtime — the Deno global below is
// valid at deploy time but unknown to the project tsconfig.
declare const Deno: { env: { get(key: string): string | undefined } };

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
    .replace("</head>", `  ${headContent}\n  </head>`);
}

export { Deno };
