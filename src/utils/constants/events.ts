import type { EventInvite } from "../../types";

export const EVENT_SHORT_ROUTES = new Map<string, string>([
  ["prgn", "4"],
  ["live-go", "3"],
  ["gu", "14"],
]);

export const GEORGETOWN_EVENT_ID = -999;

export const GEORGETOWN_EVENT_INVITE: EventInvite = {
  headline:
    "Want to continue this conversation at a university-sponsored event?",
  details: "Thursday, November 12, on campus.",
  imageUrl:
    "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/peace-panel-event.jpeg",
  registrationUrl: "http://tinyurl.com/Nov12-SHIFT",
};
