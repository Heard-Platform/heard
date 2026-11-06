import type {
  EventReportAttendeeStatementAdded,
  EventReportCamp,
  EventReportCampAnalysis,
  EventReportCampStatement,
  EventReportPromptStart,
  EventReportStatementByCamp,
  EventReportTimeline,
  EventReportTimelineBin,
} from "../types";

const CONVERTS_CAMP_ID = "value-converts";
const HOURLIES_CAMP_ID = "pragmatic-hourlies";
const SQUEEZED_CAMP_ID = "ai-squeezed";

const CAMP_SIZE_SHARES = {
  converts: 0.41,
  hourlies: 0.34,
  squeezed: 0.25,
};

const campStatement = (
  statementId: string,
  text: string,
  campAgreePercent: number,
  otherCampsAgreePercent: number,
  isAttendeeStatement = false,
): EventReportCampStatement => ({
  statementId,
  text,
  isAttendeeStatement,
  campAgreePercent,
  otherCampsAgreePercent,
});

const PRICING_SESSION_CAMPS: EventReportCamp[] = [
  {
    campId: CONVERTS_CAMP_ID,
    name: "The Value Converts",
    description:
      "Already moving off hourly and looking for the playbook.",
    memberCount: 26,
    sizePercent: 41,
    representativeStatements: [
      campStatement(
        "s7a",
        "Offering three pricing options would win us bigger deals.",
        92,
        38,
      ),
      campStatement(
        "s6c",
        "Hourly is a habit, not a strategy.",
        85,
        30,
        true,
      ),
    ],
  },
  {
    campId: HOURLIES_CAMP_ID,
    name: "The Pragmatic Hourlies",
    description:
      "See the flaws in hourly, but their clients and teams run on it.",
    memberCount: 22,
    sizePercent: 34,
    representativeStatements: [
      campStatement(
        "c2a",
        "Without hourly billing, scope creep would eat us alive.",
        85,
        22,
      ),
      campStatement(
        "c2b",
        "Clients and procurement expect hours, so we're stuck with them.",
        80,
        30,
      ),
    ],
  },
  {
    campId: SQUEEZED_CAMP_ID,
    name: "The AI Squeezed",
    description:
      "Feeling clients push AI savings back onto the price.",
    memberCount: 16,
    sizePercent: 25,
    representativeStatements: [
      campStatement(
        "c3a",
        "A client has already asked us to cut prices because of AI.",
        90,
        26,
      ),
      campStatement(
        "c3b",
        "If AI makes our work faster, clients deserve to pay less.",
        71,
        18,
      ),
    ],
  },
];

const findFixturePostNumber = (statementId: string): number =>
  Number(statementId.match(/\d+/)?.[0] ?? 1);

const statementByCamp = (
  statementId: string,
  text: string,
  [convertsPercent, hourliesPercent, squeezedPercent]: [
    number,
    number,
    number,
  ],
  isAttendeeStatement = false,
): EventReportStatementByCamp => ({
  statementId,
  text,
  postNumber: findFixturePostNumber(statementId),
  isAttendeeStatement,
  overallAgreePercent: Math.round(
    CAMP_SIZE_SHARES.converts * convertsPercent +
      CAMP_SIZE_SHARES.hourlies * hourliesPercent +
      CAMP_SIZE_SHARES.squeezed * squeezedPercent,
  ),
  campAgreements: [
    { campId: CONVERTS_CAMP_ID, agreePercent: convertsPercent },
    { campId: HOURLIES_CAMP_ID, agreePercent: hourliesPercent },
    { campId: SQUEEZED_CAMP_ID, agreePercent: squeezedPercent },
  ],
});

const HOURLY_PUNISHES = statementByCamp(
  "s2a",
  "Hourly billing punishes us for doing great work fast.",
  [94, 81, 86],
);
const STAFF_HATE_TRACKING = statementByCamp(
  "c5a",
  "Our staff hate tracking time.",
  [86, 79, 40],
);
const NOT_TELLING_CLIENTS_ABOUT_AI = statementByCamp(
  "s4a",
  "We don't tell clients how much AI we use.",
  [45, 77, 81],
);
const DISCOVERY_ON_OUTCOMES = statementByCamp(
  "s5a",
  "Most of our discovery conversation is about the client's business outcome.",
  [83, 48, 72],
);

const PRICING_SESSION_STATEMENTS_BY_CAMP: EventReportStatementByCamp[] =
  [
    HOURLY_PUNISHES,
    statementByCamp(
      "s8a",
      "We pitch too many prospects who can't afford us.",
      [82, 76, 79],
    ),
    statementByCamp(
      "s10c",
      "We should compare notes on pricing at our next member meeting.",
      [88, 80, 83],
      true,
    ),
    statementByCamp(
      "s2c",
      "Timesheets are the most hated hour of our week.",
      [85, 72, 84],
      true,
    ),
    STAFF_HATE_TRACKING,
    statementByCamp(
      "s8c",
      "Budget is the first question, not the last.",
      [80, 72, 55],
      true,
    ),
    NOT_TELLING_CLIENTS_ABOUT_AI,
    statementByCamp(
      "s6a",
      "Our staffing model is built around hours, so changing pricing means changing everything.",
      [50, 82, 70],
    ),
    DISCOVERY_ON_OUTCOMES,
    statementByCamp(
      "s4c",
      "Clients should pay for the result, not for the tool we used to get it.",
      [90, 40, 68],
      true,
    ),
    statementByCamp(
      "s7a",
      "Offering three pricing options would win us bigger deals.",
      [92, 35, 40],
    ),
    statementByCamp(
      "s10a",
      "We'll test value pricing on new prospects before existing clients.",
      [88, 38, 44],
    ),
    statementByCamp(
      "s3a",
      "We should bill for the ten years of relationship, not the fifteen minutes.",
      [89, 55, 56],
    ),
    statementByCamp(
      "s6c",
      "Hourly is a habit, not a strategy.",
      [85, 20, 45],
      true,
    ),
    statementByCamp(
      "s3c",
      "Relationships are our product, not a free extra.",
      [84, 50, 52],
      true,
    ),
    statementByCamp(
      "s4b",
      "AI efficiency should go to our margin, not to a client discount.",
      [78, 30, 25],
    ),
    statementByCamp(
      "c2a",
      "Without hourly billing, scope creep would eat us alive.",
      [22, 85, 30],
    ),
    statementByCamp(
      "c2b",
      "Clients and procurement expect hours, so we're stuck with them.",
      [30, 80, 35],
    ),
    statementByCamp(
      "s6b",
      "Honestly, hourly works fine for us.",
      [10, 78, 40],
    ),
    statementByCamp(
      "s1c",
      "We bill differently in every country we work in.",
      [50, 74, 55],
      true,
    ),
    statementByCamp(
      "c3a",
      "A client has already asked us to cut prices because of AI.",
      [28, 30, 90],
    ),
    statementByCamp(
      "c3b",
      "If AI makes our work faster, clients deserve to pay less.",
      [15, 25, 71],
    ),
    statementByCamp(
      "s8b",
      "Agencies should publish their minimums.",
      [40, 45, 66],
    ),
    statementByCamp(
      "s7b",
      "Our proposals usually offer only one price.",
      [20, 55, 50],
    ),
    statementByCamp(
      "s9b",
      "We have no formal retainer minimum.",
      [35, 50, 45],
    ),
    statementByCamp(
      "s2b",
      "Clients auditing our timesheets is a real headache.",
      [55, 52, 48],
    ),
  ];

export const PRICING_SESSION_CAMP_ANALYSIS: EventReportCampAnalysis =
  {
    camps: PRICING_SESSION_CAMPS,
    statementsByCamp: PRICING_SESSION_STATEMENTS_BY_CAMP,
    bridges: [
      {
        campIds: [CONVERTS_CAMP_ID, HOURLIES_CAMP_ID],
        statement: STAFF_HATE_TRACKING,
      },
      {
        campIds: [HOURLIES_CAMP_ID, SQUEEZED_CAMP_ID],
        statement: NOT_TELLING_CLIENTS_ABOUT_AI,
      },
      {
        campIds: [CONVERTS_CAMP_ID, SQUEEZED_CAMP_ID],
        statement: DISCOVERY_ON_OUTCOMES,
      },
    ],
    commonGroundStatement: HOURLY_PUNISHES,
  };

export const NO_CAMPS_ANALYSIS: EventReportCampAnalysis = {
  camps: [],
  statementsByCamp: [],
  bridges: [],
  commonGroundStatement: null,
};

const TIMELINE_BIN_SECONDS = 20;
const ATTENTION_FADE_SECONDS = 55;
const FLOOR_BUMP_VOTERS = [9, 5, 2];

interface TimelinePrompt {
  secondsOnPost: number;
  voterCount: number;
  attention: number;
  attendeeStatementTexts: string[];
}

const PRICING_SESSION_TIMELINE_PROMPTS: TimelinePrompt[] = [
  {
    secondsOnPost: 130,
    voterCount: 61,
    attention: 0.82,
    attendeeStatementTexts: [
      "We bill differently in every country we work in.",
    ],
  },
  {
    secondsOnPost: 220,
    voterCount: 57,
    attention: 0.86,
    attendeeStatementTexts: [
      "Timesheets are the most hated hour of our week.",
      "Our software only tracks hours, so we bill hours.",
    ],
  },
  {
    secondsOnPost: 245,
    voterCount: 62,
    attention: 0.88,
    attendeeStatementTexts: [
      "Relationships are our product, not a free extra.",
      "Access is worth more than output.",
    ],
  },
  {
    secondsOnPost: 320,
    voterCount: 58,
    attention: 1,
    attendeeStatementTexts: [
      "Clients should pay for the result, not for the tool we used to get it.",
      "AI makes the first draft cheap, not the judgment.",
      "We should charge for AI setup as its own line.",
    ],
  },
  {
    secondsOnPost: 170,
    voterCount: 49,
    attention: 0.8,
    attendeeStatementTexts: [
      "Ask what success is worth before you quote.",
      "Discovery should be paid work.",
    ],
  },
  {
    secondsOnPost: 270,
    voterCount: 55,
    attention: 0.9,
    attendeeStatementTexts: [
      "Hourly is a habit, not a strategy.",
      "Our finance team only understands hours.",
      "Switching models is a two year project.",
    ],
  },
  {
    secondsOnPost: 190,
    voterCount: 51,
    attention: 0.82,
    attendeeStatementTexts: [
      "The middle option is the one clients pick.",
      "Member agencies should share anonymized rate cards with each other.",
    ],
  },
  {
    secondsOnPost: 160,
    voterCount: 53,
    attention: 0.78,
    attendeeStatementTexts: [
      "Budget is the first question, not the last.",
      "Procurement should be in the pricing conversation from day one.",
    ],
  },
  {
    secondsOnPost: 110,
    voterCount: 44,
    attention: 0.75,
    attendeeStatementTexts: [],
  },
  {
    secondsOnPost: 205,
    voterCount: 52,
    attention: 0.8,
    attendeeStatementTexts: [
      "We should compare notes on pricing at our next member meeting.",
      "Junior staff should never see the client's fee.",
    ],
  },
];

function buildPricingSessionTimeline(): EventReportTimeline {
  const bins: EventReportTimelineBin[] = [];
  const promptStarts: EventReportPromptStart[] = [];
  const attendeeStatementsAdded: EventReportAttendeeStatementAdded[] =
    [];
  let promptStartSeconds = 0;
  PRICING_SESSION_TIMELINE_PROMPTS.forEach((prompt, promptIndex) => {
    promptStarts.push({
      postNumber: promptIndex + 1,
      secondsSinceStart: promptStartSeconds,
    });
    const binCount = Math.round(
      prompt.secondsOnPost / TIMELINE_BIN_SECONDS,
    );
    const attendeeStatementBins = prompt.attendeeStatementTexts.map(
      (text, textIndex) => {
        const shareOfPrompt =
          (textIndex + 1) /
          (prompt.attendeeStatementTexts.length + 1);
        const binInPrompt = Math.floor(
          shareOfPrompt * (binCount - 1),
        );
        attendeeStatementsAdded.push({
          statementId: `added-${promptIndex + 1}-${textIndex + 1}`,
          text,
          secondsSinceStart:
            promptStartSeconds +
            binInPrompt * TIMELINE_BIN_SECONDS +
            5,
        });
        return binInPrompt;
      },
    );
    for (let binInPrompt = 0; binInPrompt < binCount; binInPrompt++) {
      const secondsIntoPrompt = binInPrompt * TIMELINE_BIN_SECONDS;
      const fadingAttention =
        0.3 +
        0.7 * Math.exp(-secondsIntoPrompt / ATTENTION_FADE_SECONDS);
      const floorBump = attendeeStatementBins.reduce(
        (bumpSoFar, attendeeStatementBin) => {
          const binsAfterAdding =
            binInPrompt - attendeeStatementBin - 1;
          return (
            bumpSoFar + (FLOOR_BUMP_VOTERS[binsAfterAdding] ?? 0)
          );
        },
        0,
      );
      bins.push({
        secondsSinceStart: promptStartSeconds + secondsIntoPrompt,
        activeVoterCount:
          Math.round(
            prompt.voterCount * prompt.attention * fadingAttention,
          ) + floorBump,
      });
    }
    promptStartSeconds += binCount * TIMELINE_BIN_SECONDS;
  });
  return {
    binSeconds: TIMELINE_BIN_SECONDS,
    bins,
    promptStarts,
    attendeeStatementsAdded,
  };
}

export const PRICING_SESSION_TIMELINE = buildPricingSessionTimeline();

export const NO_ATTENDEE_STATEMENTS_TIMELINE: EventReportTimeline = {
  ...PRICING_SESSION_TIMELINE,
  attendeeStatementsAdded: [],
};