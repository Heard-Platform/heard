const titleCache = new Map<string, string | null>();

// NOTE: Duplicated on frontend
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

function formatYouTubeTitle(title: string, author?: string | null): string {
  return author ? `${title} by ${cleanAuthorName(author)}` : title;
}

// NOTE: Duplicated on frontend
export async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  if (titleCache.has(videoId)) {
    return titleCache.get(videoId) ?? null;
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`,
      )}`,
    );
    if (!res.ok) {
      titleCache.set(videoId, null);
      return null;
    }
    const data = await res.json();
    if (typeof data?.title !== "string") {
      titleCache.set(videoId, null);
      return null;
    }
    const author = typeof data?.author_name === "string" ? data.author_name : null;
    const formatted = formatYouTubeTitle(data.title, author);
    titleCache.set(videoId, formatted);
    return formatted;
  } catch {
    titleCache.set(videoId, null);
    return null;
  }
}
