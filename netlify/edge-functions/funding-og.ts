import { isCrawler, injectOgHead } from "./_og-utils";
import type { Context } from "./_og-utils";

const TITLE = "Fund Heard"
const DESCRIPTION =
  "We're close to our goal of raising $5,000 by July 4th, help us get to the finish line!"
const URL = "https://heard.vote/fund";
const IMAGE = "https://img.youtube.com/vi/jFzidavpm_4/maxresdefault.jpg";

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

    return new Response(injectOgHead(spaHtml, OG_HEAD), {
      status: spaResponse.status,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return context.next();
  }
}
