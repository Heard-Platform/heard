import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  applyCampNames,
  buildCampAnalysis,
  EMPTY_CAMP_ANALYSIS,
  findCampEligibleUserIds,
} from "./event-report-camp-utils.ts";
import type { StatementTally } from "./event-report-utils.ts";
import type { EventVote, Statement, VoteType } from "./types.tsx";
import { toSimpleVote } from "./vote-type-utils.ts";

const STARTED_AT = 1_761_000_000_000;
const FIRST_GROUP = ["g1", "g2", "g3", "g4"];
const SECOND_GROUP = ["h1", "h2", "h3", "h4"];
const EVERYONE = [...FIRST_GROUP, ...SECOND_GROUP];
const MOST_OF_EVERYONE = [...FIRST_GROUP, "h1", "h2", "h3"];

const statement = (id: string, roomId: string): Statement => ({
  id,
  text: `Statement ${id}`,
  author: "moderator",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId,
  timestamp: STARTED_AT,
  round: 1,
  voters: {},
});

let voteTimestamp = STARTED_AT;

const votesOn = (
  votedStatement: Statement,
  userIds: string[],
  voteType: VoteType,
): EventVote[] =>
  userIds.map((userId) => ({
    id: `${votedStatement.id}-${userId}`,
    statementId: votedStatement.id,
    roomId: votedStatement.roomId,
    userId,
    voteType,
    timestamp: (voteTimestamp += 1000),
  }));

const DIVIDES_FIRST = statement("divides-first", "p1");
const DIVIDES_SECOND = statement("divides-second", "p1");
const OPPOSITE_FIRST = statement("opposite-first", "p2");
const OPPOSITE_SECOND = statement("opposite-second", "p2");
const EVERYONE_AGREES = statement("everyone-agrees", "p2");
const MOSTLY_AGREED = statement("mostly-agreed", "p1");

const VOTES: EventVote[] = [
  ...votesOn(DIVIDES_FIRST, FIRST_GROUP, "agree"),
  ...votesOn(DIVIDES_FIRST, SECOND_GROUP, "disagree"),
  ...votesOn(DIVIDES_SECOND, FIRST_GROUP, "super_agree"),
  ...votesOn(DIVIDES_SECOND, SECOND_GROUP, "disagree"),
  ...votesOn(OPPOSITE_FIRST, FIRST_GROUP, "disagree"),
  ...votesOn(OPPOSITE_FIRST, SECOND_GROUP, "agree"),
  ...votesOn(OPPOSITE_SECOND, FIRST_GROUP, "disagree"),
  ...votesOn(OPPOSITE_SECOND, SECOND_GROUP, "agree"),
  ...votesOn(EVERYONE_AGREES, EVERYONE, "agree"),
  ...votesOn(MOSTLY_AGREED, MOST_OF_EVERYONE, "agree"),
  ...votesOn(MOSTLY_AGREED, ["h4"], "disagree"),
  ...votesOn(EVERYONE_AGREES, ["casual"], "agree"),
];

const tallyFor = (
  talliedStatement: Statement,
  isAttendeeStatement = false,
): StatementTally => {
  const statementVotes = VOTES.filter(
    (vote) => vote.statementId === talliedStatement.id,
  );
  return {
    statement: talliedStatement,
    postNumber: Number(talliedStatement.roomId.slice(1)),
    isAttendeeStatement,
    agreeCount: statementVotes.filter(
      (vote) => toSimpleVote(vote.voteType) === "agree",
    ).length,
    disagreeCount: statementVotes.filter(
      (vote) => vote.voteType === "disagree",
    ).length,
    voteCount: statementVotes.length,
  };
};

const TALLIES = [
  tallyFor(DIVIDES_FIRST),
  tallyFor(DIVIDES_SECOND),
  tallyFor(OPPOSITE_FIRST),
  tallyFor(OPPOSITE_SECOND),
  tallyFor(EVERYONE_AGREES),
  tallyFor(MOSTLY_AGREED, true),
];

const buildFixtureResult = () =>
  buildCampAnalysis({
    tallies: TALLIES,
    rankableTallies: TALLIES,
    sessionVotes: VOTES,
  });

const buildFixtureCamps = () => buildFixtureResult().campAnalysis;

Deno.test(
  "findCampEligibleUserIds needs votes on half the statements",
  () => {
    const threeOfSix = votesOn(DIVIDES_FIRST, ["half"], "agree")
      .concat(votesOn(DIVIDES_SECOND, ["half"], "pass"))
      .concat(votesOn(OPPOSITE_FIRST, ["half"], "disagree"));
    const twoOfSix = votesOn(DIVIDES_FIRST, ["under"], "agree")
      .concat(votesOn(DIVIDES_FIRST, ["under"], "disagree"))
      .concat(votesOn(DIVIDES_SECOND, ["under"], "agree"));
    const eligibleUserIds = findCampEligibleUserIds(
      [...VOTES, ...threeOfSix, ...twoOfSix],
      TALLIES.length,
    );

    assertEquals(eligibleUserIds.includes("g1"), true);
    assertEquals(eligibleUserIds.includes("half"), true);
    assertEquals(eligibleUserIds.includes("under"), false);
    assertEquals(eligibleUserIds.includes("casual"), false);
  },
);

Deno.test("buildCampAnalysis needs two camps of three", () => {
  const fivePeople = ["g1", "g2", "g3", "h1", "h2"];
  const fewVotes = VOTES.filter((vote) =>
    fivePeople.includes(vote.userId)
  );
  const { campAnalysis, campNamingRequest } = buildCampAnalysis({
    tallies: TALLIES,
    rankableTallies: TALLIES,
    sessionVotes: fewVotes,
  });

  assertEquals(campAnalysis, EMPTY_CAMP_ANALYSIS);
  assertEquals(campNamingRequest, null);
});

Deno.test("buildCampAnalysis splits people into camps", () => {
  const { camps } = buildFixtureCamps();

  assertEquals(
    camps.map((camp) => ({
      campId: camp.campId,
      name: camp.name,
      memberCount: camp.memberCount,
      sizePercent: camp.sizePercent,
    })),
    [
      {
        campId: "camp-a",
        name: "Camp A",
        memberCount: 4,
        sizePercent: 50,
      },
      {
        campId: "camp-b",
        name: "Camp B",
        memberCount: 4,
        sizePercent: 50,
      },
    ],
  );
});

Deno.test("buildCampAnalysis lists what each camp agrees on", () => {
  const { camps } = buildFixtureCamps();
  const firstGroupCamp = camps.find((camp) =>
    camp.representativeStatements.some(
      ({ statementId }) => statementId === "divides-first",
    )
  );

  assertEquals(firstGroupCamp?.representativeStatements, [
    {
      statementId: "divides-first",
      text: "Statement divides-first",
      postNumber: 1,
      isAttendeeStatement: false,
      campAgreePercent: 100,
      otherCampsAgreePercent: 0,
    },
    {
      statementId: "divides-second",
      text: "Statement divides-second",
      postNumber: 1,
      isAttendeeStatement: false,
      campAgreePercent: 100,
      otherCampsAgreePercent: 0,
    },
    {
      statementId: "mostly-agreed",
      text: "Statement mostly-agreed",
      postNumber: 1,
      isAttendeeStatement: true,
      campAgreePercent: 100,
      otherCampsAgreePercent: 75,
    },
  ]);
});

Deno.test("buildCampAnalysis splits each statement by camp", () => {
  const { statementsByCamp } = buildFixtureCamps();
  const mostlyAgreed = statementsByCamp.find(
    ({ statementId }) => statementId === "mostly-agreed",
  );
  const campAgreePercents = mostlyAgreed?.campAgreements
    .map(({ agreePercent }) => agreePercent)
    .sort((first, second) => second - first);

  assertEquals(statementsByCamp.length, 6);
  assertEquals(mostlyAgreed?.postNumber, 1);
  assertEquals(mostlyAgreed?.isAttendeeStatement, true);
  assertEquals(mostlyAgreed?.overallAgreePercent, 88);
  assertEquals(campAgreePercents, [100, 75]);
});

Deno.test(
  "buildCampAnalysis finds common ground and a separate bridge",
  () => {
    const { commonGroundStatement, bridges } = buildFixtureCamps();

    assertEquals(
      commonGroundStatement?.statementId,
      "everyone-agrees",
    );
    assertEquals(bridges.length, 1);
    assertEquals(bridges[0].campIds, ["camp-a", "camp-b"]);
    assertEquals(bridges[0].statement.statementId, "mostly-agreed");
  },
);

Deno.test("buildCampAnalysis asks to name camps by membership", () => {
  const { campNamingRequest } = buildFixtureResult();
  const firstGroupSignature = [...FIRST_GROUP].sort().join(",");
  const secondGroupSignature = [...SECOND_GROUP].sort().join(",");
  const signatureParts =
    campNamingRequest?.membershipSignature.split("|").sort();

  assertEquals(
    signatureParts,
    [firstGroupSignature, secondGroupSignature],
  );
  assertEquals(
    campNamingRequest?.namingInputs.map(({ stableId }) => stableId),
    ["camp-a", "camp-b"],
  );
  assertEquals(
    campNamingRequest?.commonGround.includes(
      "Statement everyone-agrees",
    ),
    true,
  );
});

Deno.test("applyCampNames swaps placeholders in camp order", () => {
  const campAnalysis = buildFixtureCamps();
  const namedCamps = applyCampNames(campAnalysis, [
    "Full Speed Ahead",
    "Hit the Brakes",
  ]).camps;

  assertEquals(
    namedCamps.map(({ campId, name }) => [campId, name]),
    [
      ["camp-a", "Full Speed Ahead"],
      ["camp-b", "Hit the Brakes"],
    ],
  );
  assertEquals(applyCampNames(campAnalysis, null), campAnalysis);
});
