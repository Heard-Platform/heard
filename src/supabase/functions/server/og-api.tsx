import { Hono } from "npm:hono";
import { getDebate } from "./kv-utils.tsx";
import { API_URL_PREFIX } from "./constants.tsx";

const SITE_NAME = "Heard";
const SITE_URL = "https://heard.vote";
const FALLBACK_IMAGE = `${SITE_URL}/monkey.png`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOgHtml(params: {
  topic: string;
  description: string | null;
  emoji: string | null;
  imageUrl: string | null;
  roomId: string;
}): string {
  const title = params.emoji ? `${params.emoji} ${params.topic}` : params.topic;
  const description = params.description ?? "Join the debate on Heard";
  const image = params.imageUrl ?? FALLBACK_IMAGE;
  const url = `${SITE_URL}/room/${params.roomId}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)} | ${SITE_NAME}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${image}" />
  </head>
  <body style="margin:0;font-family:sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;">
    <div style="background:white;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.12);max-width:480px;width:100%;overflow:hidden;">
      <img src="${image}" alt="" style="width:100%;display:block;aspect-ratio:2/1;object-fit:cover;" onerror="this.style.display='none'" />
      <div style="padding:16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${SITE_NAME} &mdash; heard.vote</p>
        <h1 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(title)}</h1>
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">${escapeHtml(description)}</p>
      </div>
    </div>
  </body>
</html>`;
}

const ogApi = new Hono();

ogApi.get(`${API_URL_PREFIX}/og/:roomId`, async (c) => {
  const { roomId } = c.req.param();
  const room = await getDebate(roomId);

  if (!room) {
    return c.html(
      `<!DOCTYPE html><html><head><title>Not Found | ${SITE_NAME}</title></head><body>Room not found</body></html>`,
      404,
    );
  }

  return c.html(buildOgHtml({
    topic: room.topic,
    description: room.description ?? null,
    emoji: room.emoji ?? null,
    imageUrl: room.imageUrl ?? null,
    roomId,
  }));
});

export { ogApi };
