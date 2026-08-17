import { escapeHtml } from "./utils.tsx";
import { extractYouTubeVideoId, fetchYouTubeTitle } from "./youtube-utils.tsx";

export const renderStatementText = async (text: string): Promise<string> => {
  const videoId = extractYouTubeVideoId(text);
  if (!videoId) {
    return `"${escapeHtml(text)}"`;
  }
  const title = await fetchYouTubeTitle(videoId);
  return `<a href="${escapeHtml(text)}" target="_blank" rel="noopener noreferrer" style="color: #2d3748; text-decoration: underline; text-underline-offset: 2px;">${escapeHtml(title ?? text)}</a>`;
};
