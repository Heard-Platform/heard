// Netlify Edge Functions run in a Deno runtime — the URL import and Deno
// global below are valid at deploy time but unknown to the project tsconfig.
// The inline declarations below resolve those type errors without @ts-nocheck.

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

  if (!isCrawler(userAgent)) {
    return context.next();
  }

  const functionsUrl = Deno.env.get("SUPABASE_FUNCTIONS_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!functionsUrl || !anonKey) return context.next();

  const { pathname } = new URL(request.url);
  const roomId = pathname.split("/room/")[1]?.split("/")[0];
  if (!roomId) return context.next();

  try {
    const res = await fetch(`${functionsUrl}/og/${roomId}`, {
      headers: { Authorization: `Bearer ${anonKey}` },
    });
    if (!res.ok) return context.next();
    return res;
  } catch {
    return context.next();
  }
}
