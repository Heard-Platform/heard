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

export default async function handler(request: Request, context: Context): Promise<Response> {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!isCrawler(userAgent)) return context.next();

  const functionsUrl = Deno.env.get("SUPABASE_FUNCTIONS_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!functionsUrl || !anonKey) return context.next();

  const { pathname } = new URL(request.url);
  const roomId = pathname.split("/room/")[1]?.split("/")[0];
  if (!roomId) return context.next();

  try {
    const [spaResponse, ogResponse] = await Promise.all([
      context.next(),
      fetch(`${functionsUrl}/og/${roomId}`, {
        headers: { Authorization: `Bearer ${anonKey}` },
      }),
    ]);

    if (!ogResponse.ok) return spaResponse;

    const [spaHtml, ogHtml] = await Promise.all([
      spaResponse.text(),
      ogResponse.text(),
    ]);

    // Pull the <head> content out of the OG page, dropping <meta charset> since
    // the SPA already has one.
    const ogHeadContent = (ogHtml.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "")
      .replace(/<meta charset[^>]*>/i, "")
      .trim();

    const spaStatus = spaResponse.status;
    const fallback = () => new Response(spaHtml, {
      status: spaStatus,
      headers: { "content-type": "text/html; charset=utf-8" },
    });

    if (!ogHeadContent) return fallback();

    // Remove the static SPA title (the OG head content has the room-specific one)
    // then inject everything before </head>.
    const injected = spaHtml
      .replace(/<title>.*?<\/title>/, "")
      .replace("</head>", `  ${ogHeadContent}\n  </head>`);

    return new Response(injected, {
      status: spaStatus,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return context.next();
  }
}
