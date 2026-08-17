// This file is duplicated on backend

const titleCache = new Map<string, string | null>();
const pendingFetches = new Map<string, Promise<string | null>>();

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function cleanAuthorName(author: string): string {
  return author.replace(/\s*-\s*Topic$/i, "");
}

export function formatYouTubeTitle(title: string, author?: string | null): string {
  return author ? `${title} by ${cleanAuthorName(author)}` : title;
}

export function peekYouTubeTitle(videoId: string): string | null {
  return titleCache.get(videoId) ?? null;
}

export function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  if (titleCache.has(videoId)) {
    return Promise.resolve(titleCache.get(videoId) ?? null);
  }

  const pending = pendingFetches.get(videoId);
  if (pending) return pending;

  const promise = fetch(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}`,
  )
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (typeof data?.title !== "string") {
        titleCache.set(videoId, null);
        return null;
      }
      const author = typeof data?.author_name === "string" ? data.author_name : null;
      const formatted = formatYouTubeTitle(data.title, author);
      titleCache.set(videoId, formatted);
      return formatted;
    })
    .catch(() => {
      titleCache.set(videoId, null);
      return null;
    })
    .finally(() => {
      pendingFetches.delete(videoId);
    });

  pendingFetches.set(videoId, promise);
  return promise;
}
