import { parseQueryParams, removeQueryParams } from "./url";

const storageKeyForEvent = (eventId: string) => `event_display_key:${eventId}`;

const readStoredDisplayKey = (eventId: string): string | null => {
  try {
    return sessionStorage.getItem(storageKeyForEvent(eventId));
  } catch {
    return null;
  }
};

const storeDisplayKey = (eventId: string, displayKey: string) => {
  try {
    sessionStorage.setItem(storageKeyForEvent(eventId), displayKey);
  } catch {
    return;
  }
};

export function takeDisplayKeyFromUrl(eventId: string): string | null {
  const displayKeyFromUrl = parseQueryParams().displayKey;
  if (!displayKeyFromUrl) return readStoredDisplayKey(eventId);
  storeDisplayKey(eventId, displayKeyFromUrl);
  removeQueryParams("displayKey");
  return displayKeyFromUrl;
}
