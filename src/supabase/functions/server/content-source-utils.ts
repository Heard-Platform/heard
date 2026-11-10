import type { ContentSource } from "./types.tsx";

export const getContentSource = (
  isFromEvent: boolean,
): ContentSource => (isFromEvent ? "event" : "feed");
