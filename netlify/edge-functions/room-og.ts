import { isCrawler, injectOgHead } from "../og-utils.ts";
import type { Context } from "../og-utils.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

export default async function handler(request: Request, context: Context): Promise<Response> {
  const userAgent = request.headers.get("user-agent") ?? "";
  console.log(`Received request with UA: ${userAgent}`);
  if (!isCrawler(userAgent)) {
    console.log(`Not a crawler (UA: ${userAgent}), skipping OG fetch`);
    return context.next();
  }

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

    const fallback = () => new Response(spaHtml, {
      status: spaResponse.status,
      headers: { "content-type": "text/html; charset=utf-8" },
    });

    if (!ogHeadContent) return fallback();

    return new Response(injectOgHead(spaHtml, ogHeadContent), {
      status: spaResponse.status,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return context.next();
  }
}
