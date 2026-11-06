import type {
  EventReport,
  EventReportAttendeeStatement,
  EventReportFloor,
  EventReportPost,
  EventReportStatement,
} from "../types";
import { ONE_MINUTE_MS } from "../utils/time";
import {
  NO_ATTENDEE_STATEMENTS_TIMELINE,
  NO_CAMPS_ANALYSIS,
  PRICING_SESSION_CAMP_ANALYSIS,
  PRICING_SESSION_TIMELINE,
} from "./event-report-analysis-fixtures";

const PRICING_SESSION_STARTED_AT = Date.UTC(2026, 9, 23, 13, 10);

const reportStatement = (
  statementId: string,
  text: string,
  agreePercent: number,
  disagreePercent: number,
): EventReportStatement => ({
  statementId,
  text,
  agreePercent,
  disagreePercent,
});

type FixturePost = Omit<EventReportPost, "roomId" | "postNumber">;

const reportPost = (
  postNumber: number,
  fixturePost: FixturePost,
): EventReportPost => ({
  roomId: `pricing-post-${postNumber}`,
  postNumber,
  ...fixturePost,
});

const PRICING_SESSION_POSTS: EventReportPost[] = [
  reportPost(1, {
    topic: "What's your agency's main billing model?",
    voterCount: 61,
    secondsOnPost: 130,
    mostAgreedStatement: reportStatement(
      "s1a",
      "Most of our accounts are on a mix of billing models.",
      64,
      28,
    ),
    mostSplitStatement: reportStatement(
      "s1b",
      "Our main billing model is hourly.",
      48,
      46,
    ),
    topAttendeeStatement: reportStatement(
      "s1c",
      "We bill differently in every country we work in.",
      70,
      22,
    ),
  }),
  reportPost(2, {
    topic: "What's the biggest headache hourly billing causes you?",
    voterCount: 57,
    secondsOnPost: 220,
    mostAgreedStatement: reportStatement(
      "s2a",
      "Hourly billing punishes us for doing great work fast.",
      88,
      8,
    ),
    mostSplitStatement: reportStatement(
      "s2b",
      "Clients auditing our timesheets is a real headache.",
      52,
      44,
    ),
    topAttendeeStatement: reportStatement(
      "s2c",
      "Timesheets are the most hated hour of our week.",
      81,
      12,
    ),
  }),
  reportPost(3, {
    topic:
      "If one text gets a client a meeting with the mayor's office, how should you bill for it?",
    voterCount: 62,
    secondsOnPost: 245,
    mostAgreedStatement: reportStatement(
      "s3a",
      "We should bill for the ten years of relationship, not the fifteen minutes.",
      81,
      14,
    ),
    mostSplitStatement: reportStatement(
      "s3b",
      "We usually don't bill for wins that come from our relationships.",
      50,
      45,
    ),
    topAttendeeStatement: reportStatement(
      "s3c",
      "Relationships are our product, not a free extra.",
      76,
      18,
    ),
  }),
  reportPost(4, {
    topic: "How has AI impacted your pricing model?",
    voterCount: 58,
    secondsOnPost: 320,
    mostAgreedStatement: reportStatement(
      "s4a",
      "We don't tell clients how much AI we use.",
      71,
      22,
    ),
    mostSplitStatement: reportStatement(
      "s4b",
      "AI efficiency should go to our margin, not to a client discount.",
      49,
      47,
    ),
    topAttendeeStatement: reportStatement(
      "s4c",
      "Clients should pay for the result, not for the tool we used to get it.",
      77,
      15,
    ),
  }),
  reportPost(5, {
    topic: "What do your discovery calls focus on?",
    voterCount: 49,
    secondsOnPost: 170,
    mostAgreedStatement: reportStatement(
      "s5a",
      "Most of our discovery conversation is about the client's business outcome.",
      67,
      25,
    ),
    mostSplitStatement: reportStatement(
      "s5b",
      "How we price depends more on who leads the pitch than on agency policy.",
      48,
      48,
    ),
    topAttendeeStatement: reportStatement(
      "s5c",
      "Ask what success is worth before you quote.",
      72,
      20,
    ),
  }),
  reportPost(6, {
    topic: "What keeps your agency on hourly billing?",
    voterCount: 55,
    secondsOnPost: 270,
    mostAgreedStatement: reportStatement(
      "s6a",
      "Our staffing model is built around hours, so changing pricing means changing everything.",
      70,
      24,
    ),
    mostSplitStatement: reportStatement(
      "s6b",
      "Honestly, hourly works fine for us.",
      46,
      50,
    ),
    topAttendeeStatement: reportStatement(
      "s6c",
      "Hourly is a habit, not a strategy.",
      68,
      27,
    ),
  }),
  reportPost(7, {
    topic: "How many pricing options do your proposals offer?",
    voterCount: 51,
    secondsOnPost: 190,
    mostAgreedStatement: reportStatement(
      "s7a",
      "Offering three pricing options would win us bigger deals.",
      74,
      19,
    ),
    mostSplitStatement: reportStatement(
      "s7b",
      "Our proposals usually offer only one price.",
      47,
      49,
    ),
    topAttendeeStatement: reportStatement(
      "s7c",
      "The middle option is the one clients pick.",
      69,
      23,
    ),
  }),
  reportPost(8, {
    topic: "How do you screen prospects who can't afford you?",
    voterCount: 53,
    secondsOnPost: 160,
    mostAgreedStatement: reportStatement(
      "s8a",
      "We pitch too many prospects who can't afford us.",
      79,
      16,
    ),
    mostSplitStatement: reportStatement(
      "s8b",
      "Agencies should publish their minimums.",
      50,
      50,
    ),
    topAttendeeStatement: reportStatement(
      "s8c",
      "Budget is the first question, not the last.",
      73,
      21,
    ),
  }),
  reportPost(9, {
    topic: "What's your monthly retainer minimum?",
    voterCount: 44,
    secondsOnPost: 110,
    mostAgreedStatement: reportStatement(
      "s9a",
      "Our monthly retainer minimum is under $10K.",
      62,
      33,
    ),
    mostSplitStatement: reportStatement(
      "s9b",
      "We have no formal retainer minimum.",
      45,
      51,
    ),
    topAttendeeStatement: null,
  }),
  reportPost(10, {
    topic: "What will you change about pricing in the next 90 days?",
    voterCount: 52,
    secondsOnPost: 205,
    mostAgreedStatement: reportStatement(
      "s10a",
      "We'll test value pricing on new prospects before existing clients.",
      70,
      22,
    ),
    mostSplitStatement: reportStatement(
      "s10b",
      "In the next 90 days, we'll put three options in a proposal.",
      52,
      41,
    ),
    topAttendeeStatement: reportStatement(
      "s10c",
      "We should compare notes on pricing at our next member meeting.",
      84,
      9,
    ),
  }),
];

const attendeeStatement = (
  statement: EventReportStatement,
  postNumber: number,
  voteCount: number,
): EventReportAttendeeStatement => ({
  ...statement,
  postNumber,
  voteCount,
});

const PRICING_SESSION_FLOOR: EventReportFloor = {
  attendeeCount: 14,
  attendeeStatementVoteCount: 412,
  attendeeStatementsInTopTenCount: 3,
  averageAttendeeAgreePercent: 74,
  averagePreparedAgreePercent: 61,
  topAttendeeStatements: [
    attendeeStatement(
      reportStatement(
        "s10c",
        "We should compare notes on pricing at our next member meeting.",
        84,
        9,
      ),
      10,
      44,
    ),
    attendeeStatement(
      reportStatement(
        "s2c",
        "Timesheets are the most hated hour of our week.",
        81,
        12,
      ),
      2,
      52,
    ),
    attendeeStatement(
      reportStatement(
        "s4c",
        "Clients should pay for the result, not for the tool we used to get it.",
        77,
        15,
      ),
      4,
      50,
    ),
    attendeeStatement(
      reportStatement(
        "s3c",
        "Relationships are our product, not a free extra.",
        76,
        18,
      ),
      3,
      55,
    ),
    attendeeStatement(
      reportStatement(
        "s8c",
        "Budget is the first question, not the last.",
        73,
        21,
      ),
      8,
      47,
    ),
  ],
  lowVoteAttendeeStatements: [
    attendeeStatement(
      reportStatement(
        "s8d",
        "Procurement should be in the pricing conversation from day one.",
        75,
        25,
      ),
      8,
      4,
    ),
    attendeeStatement(
      reportStatement(
        "s7d",
        "Member agencies should share anonymized rate cards with each other.",
        67,
        33,
      ),
      7,
      3,
    ),
    attendeeStatement(
      reportStatement(
        "s10d",
        "Junior staff should never see the client's fee.",
        50,
        50,
      ),
      10,
      2,
    ),
  ],
};

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
  floor: PRICING_SESSION_FLOOR,
  campAnalysis: PRICING_SESSION_CAMP_ANALYSIS,
  timeline: PRICING_SESSION_TIMELINE,
};

export const NO_SUBTITLE_REPORT: EventReport = {
  ...PRICING_SESSION_REPORT,
  opening: {
    ...PRICING_SESSION_REPORT.opening,
    eventSubtitle: null,
  },
};

export const NO_ATTENDEE_STATEMENTS_REPORT: EventReport = {
  ...PRICING_SESSION_REPORT,
  opening: {
    ...PRICING_SESSION_REPORT.opening,
    attendeeStatementCount: 0,
  },
  posts: PRICING_SESSION_POSTS.map((post) => ({
    ...post,
    topAttendeeStatement: null,
  })),
  floor: {
    attendeeCount: 0,
    attendeeStatementVoteCount: 0,
    attendeeStatementsInTopTenCount: 0,
    averageAttendeeAgreePercent: 0,
    averagePreparedAgreePercent: 61,
    topAttendeeStatements: [],
    lowVoteAttendeeStatements: [],
  },
  timeline: NO_ATTENDEE_STATEMENTS_TIMELINE,
};

export const NO_CAMPS_REPORT: EventReport = {
  ...PRICING_SESSION_REPORT,
  campAnalysis: NO_CAMPS_ANALYSIS,
};