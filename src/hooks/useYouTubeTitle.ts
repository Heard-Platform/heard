import { useEffect, useState } from "react";

const titleCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string | null>>();

function cleanAuthorName(author: string): string {
  return author.replace(/\s*-\s*Topic$/i, "");
}

export function formatYouTubeTitle(title: string, author?: string | null): string {
  return author ? `${title} by ${cleanAuthorName(author)}` : title;
}

function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  const pending = pendingFetches.get(videoId);
  if (pending) return pending;

  const promise = fetch(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}`,
  )
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (typeof data?.title !== "string") return null;
      const author = typeof data?.author_name === "string" ? data.author_name : null;
      const formatted = formatYouTubeTitle(data.title, author);
      titleCache.set(videoId, formatted);
      return formatted;
    })
    .catch(() => null)
    .finally(() => {
      pendingFetches.delete(videoId);
    });

  pendingFetches.set(videoId, promise);
  return promise;
}

export function useYouTubeTitle(videoId: string | null): string | null {
  const [title, setTitle] = useState<string | null>(
    videoId ? (titleCache.get(videoId) ?? null) : null,
  );

  useEffect(() => {
    if (!videoId) {
      setTitle(null);
      return;
    }
    const cached = titleCache.get(videoId);
    if (cached) {
      setTitle(cached);
      return;
    }
    let cancelled = false;
    fetchYouTubeTitle(videoId).then((result) => {
      if (!cancelled) setTitle(result);
    });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  return title;
}
