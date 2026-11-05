import type { EventReport } from "../types";
import { ONE_MINUTE_MS } from "../utils/time";

const PRICING_SESSION_STARTED_AT = Date.UTC(2026, 9, 23, 13, 10);

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
};

export const NO_SUBTITLE_REPORT: EventReport = {
  opening: {
    ...PRICING_SESSION_REPORT.opening,
    eventSubtitle: null,
  },
};