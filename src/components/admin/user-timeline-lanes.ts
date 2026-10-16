import { UserTimelineEvent, UserTimelineEventKind } from "../../types";

export interface TimelineLane {
  label: string;
  color: string;
  kinds: UserTimelineEventKind[];
  trackedEventPatterns: RegExp[];
}

// Fixed order so a lane keeps its color regardless of which lanes are present.
// Tracked events go in the first lane with a matching pattern, else "Other events".
export const TIMELINE_LANES: TimelineLane[] = [
  {
    label: "Anon session",
    color: "#2a78d6",
    kinds: ["anon_session_started"],
    trackedEventPatterns: [],
  },
  {
    label: "Account",
    color: "#eb6834",
    kinds: ["account_created", "first_seen"],
    trackedEventPatterns: [
      /^anon_response_tripwire_/,
      /^certify_card_/,
      /^flyer_save_spot_/,
      /^flyer_.*email/,
      /^personal_flyer_screen_email_added/,
      /^verify_human_/,
      /^session_expired_recovered$/,
      /^subscribe_updates_clicked$/,
    ],
  },
  {
    label: "Posts",
    color: "#1baf7a",
    kinds: ["room_created"],
    trackedEventPatterns: [
      /^post_viewed$/,
      /^room_/,
      /^cohost_invite_accepted$/,
      /^ask_the_data_/,
    ],
  },
  {
    label: "Statements",
    color: "#eda100",
    kinds: ["statement_posted"],
    trackedEventPatterns: [],
  },
  {
    label: "Votes",
    color: "#e87ba4",
    kinds: ["vote_cast"],
    trackedEventPatterns: [/^vote_swing_/, /^flyer_swipe_card_/],
  },
  {
    label: "Rants",
    color: "#008300",
    kinds: ["rant_submitted"],
    trackedEventPatterns: [],
  },
  {
    label: "Emails",
    color: "#e34948",
    kinds: ["email_sent"],
    trackedEventPatterns: [/_notif_button_clicked$/],
  },
  {
    label: "Other events",
    color: "#6250d6",
    kinds: ["tracked_event"],
    trackedEventPatterns: [],
  },
];

const OTHER_EVENTS_LANE = TIMELINE_LANES[TIMELINE_LANES.length - 1];

export const getLaneForEntry = (entry: UserTimelineEvent): TimelineLane => {
  if (entry.kind !== "tracked_event") {
    return TIMELINE_LANES.find((lane) => lane.kinds.includes(entry.kind)) ?? OTHER_EVENTS_LANE;
  }
  return (
    TIMELINE_LANES.find((lane) =>
      lane.trackedEventPatterns.some((pattern) => pattern.test(entry.label)),
    ) ?? OTHER_EVENTS_LANE
  );
};
