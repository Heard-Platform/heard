import { useEffect, useState } from "react";
import { fetchYouTubeTitle, peekYouTubeTitle } from "../utils/youtube-utils";

export function useYouTubeTitle(videoId: string | null): string | null {
  const [title, setTitle] = useState<string | null>(
    videoId ? peekYouTubeTitle(videoId) : null,
  );

  useEffect(() => {
    if (!videoId) {
      setTitle(null);
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
