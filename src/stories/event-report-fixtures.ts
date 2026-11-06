import type { EventReport, EventReportPost } from "../types";
import { ONE_MINUTE_MS } from "../utils/time";

const PRICING_SESSION_STARTED_AT = Date.UTC(2026, 9, 23, 13, 10);

const reportPost = (
  postNumber: number,
  topic: string,
  voterCount: number,
  secondsOnPost: number,
): EventReportPost => ({
  roomId: `pricing-post-${postNumber}`,
  postNumber,
  topic,
  voterCount,
  secondsOnPost,
});

const PRICING_SESSION_POSTS: EventReportPost[] = [
  reportPost(1, "What's your agency's main billing model?", 61, 130),
  reportPost(
    2,
    "What's the biggest headache hourly billing causes you?",
    57,
    220,
  ),
  reportPost(
    3,
    "If one text gets a client a meeting with the mayor's office, how should you bill for it?",
    62,
    245,
  ),
  reportPost(4, "How has AI impacted your pricing model?", 58, 320),
  reportPost(5, "What do your discovery calls focus on?", 49, 170),
  reportPost(6, "What keeps your agency on hourly billing?", 55, 270),
  reportPost(
    7,
    "How many pricing options do your proposals offer?",
    51,
    190,
  ),
  reportPost(
    8,
    "How do you screen prospects who can't afford you?",
    53,
    160,
  ),
  reportPost(9, "What's your monthly retainer minimum?", 44, 110),
  reportPost(
    10,
    "What will you change about pricing in the next 90 days?",
    52,
    205,
  ),
];

export const PRICING_SESSION_REPORT: EventReport = {
  opening: {
    eventName: "Should agencies leave the billable hour behind?",
    eventSubtitle: "Pricing session at the fall member meeting",
    peopleCount: 64,
    voteCount: 1540,
    postCount: 10,
    attendeeStatementCount: 19,
    averagePostParticipationPercent: 85,
    sessionStartedAt: PRICING_SESSION_STARTED_AT,
    sessionEndedAt: PRICING_SESSION_STARTED_AT + 34 * ONE_MINUTE_MS,
  },
  posts: PRICING_SESSION_POSTS,
};

export const NO_SUBTITLE_REPORT: EventReport = {
  ...PRICING_SESSION_REPORT,
  opening: {
    ...PRICING_SESSION_REPORT.opening,
    eventSubtitle: null,
  },
};