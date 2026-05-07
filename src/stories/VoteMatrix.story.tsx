import { VoteMatrix } from "../components/room/VoteMatrix";
import { StoryContainer } from "./StoryContainer";
import type { Statement, StatementMerge } from "../types";

const u = (n: number) => `user-${String(n).padStart(4, "0")}`;

function makeStatement(
  id: string,
  text: string,
  author: string,
  voters: Record<string, Statement["voters"][string]>
): Statement {
  const agrees = Object.values(voters).filter((v) => v === "agree").length;
  const superAgrees = Object.values(voters).filter((v) => v === "super_agree").length;
  const disagrees = Object.values(voters).filter((v) => v === "disagree").length;
  const passes = Object.values(voters).filter((v) => v === "pass").length;
  return {
    id,
    text,
    author,
    agrees,
    disagrees,
    passes,
    superAgrees,
    roomId: "room-demo",
    timestamp: Date.now(),
    round: 1,
    voters,
  };
}

// --- Basic variant (no merges) ---
const basicStatements: Statement[] = [
  makeStatement("b1", "The city should ban single-use plastics at all restaurants.", u(1), {
    [u(2)]: "agree", [u(3)]: "agree", [u(4)]: "super_agree", [u(5)]: "disagree", [u(6)]: "pass",
  }),
  makeStatement("b2", "Public parks should be open 24 hours.", u(2), {
    [u(1)]: "disagree", [u(3)]: "pass", [u(4)]: "agree", [u(5)]: "agree", [u(6)]: "agree",
  }),
  makeStatement("b3", "Remote work should be the default for office jobs.", u(3), {
    [u(1)]: "super_agree", [u(2)]: "agree", [u(4)]: "agree", [u(5)]: "pass", [u(6)]: "disagree",
  }),
  makeStatement("b4", "Schools should start no earlier than 9am.", u(4), {
    [u(1)]: "agree", [u(2)]: "super_agree", [u(3)]: "agree", [u(5)]: "disagree", [u(6)]: "disagree",
  }),
  makeStatement("b5", "All new construction should include solar panels.", u(5), {
    [u(1)]: "pass", [u(2)]: "agree", [u(3)]: "disagree", [u(4)]: "agree", [u(6)]: "agree",
  }),
];

// --- With merges variant ---
const mergeStatements: Statement[] = [
  makeStatement("m1", "We should expand the bike lane network downtown.", u(1), {
    [u(2)]: "super_agree", [u(3)]: "agree", [u(4)]: "agree", [u(5)]: "pass", [u(6)]: "disagree", [u(7)]: "agree",
  }),
  makeStatement("m2", "More protected bike lanes are needed in the city center.", u(2), {
    [u(1)]: "agree", [u(3)]: "pass", [u(4)]: "agree", [u(5)]: "disagree",
  }),
  makeStatement("m3", "Downtown needs better cycling infrastructure.", u(3), {
    [u(1)]: "agree", [u(2)]: "agree", [u(4)]: "super_agree", [u(6)]: "pass",
  }),
  makeStatement("m4", "Street parking should be converted to green space.", u(4), {
    [u(1)]: "disagree", [u(2)]: "agree", [u(3)]: "agree", [u(5)]: "super_agree", [u(7)]: "pass",
  }),
  makeStatement("m5", "The farmers market should run year-round.", u(5), {
    [u(1)]: "agree", [u(2)]: "agree", [u(3)]: "agree", [u(4)]: "agree", [u(6)]: "agree", [u(7)]: "agree",
  }),
  makeStatement("m6", "Parking fees should fund public transit.", u(6), {
    [u(1)]: "pass", [u(3)]: "disagree", [u(5)]: "agree", [u(7)]: "super_agree",
  }),
];

const merges: StatementMerge[] = [
  // m2 and m3 are merged into m1 (duplicate bike lane statements)
  { id: "merge-1", roomId: "room-demo", sourceStatementId: "m2", targetStatementId: "m1", creatorId: u(1), createdAt: new Date().toISOString() },
  { id: "merge-2", roomId: "room-demo", sourceStatementId: "m3", targetStatementId: "m1", creatorId: u(1), createdAt: new Date().toISOString() },
];

// --- Large variant ---
const topics = [
  "The city should invest more in affordable housing near transit hubs.",
  "All public buildings should be carbon neutral by 2030.",
  "High school students should be required to take a personal finance class.",
  "The library system needs expanded evening and weekend hours.",
  "Food trucks should be allowed in all commercial zones.",
  "We need more street lighting in residential neighborhoods.",
  "The city should subsidize electric vehicle charging stations.",
  "Sidewalk maintenance should be the city's responsibility, not homeowners'.",
  "Community gardens should be established in every neighborhood.",
  "Youth sports programs deserve more public funding.",
  "The local transit app needs a real-time tracking feature.",
  "Small businesses should get a tax break on their first 5 employees.",
  "There should be a dedicated budget for public art installations.",
  "All city meetings should be live-streamed online.",
  "Noise ordinances should be strictly enforced near schools and hospitals.",
];

const voteOptions = ["agree", "disagree", "pass", "super_agree"] as const;

const largeStatements: Statement[] = topics.map((text, i) => {
  const id = `l${i + 1}`;
  const author = u(i % 6 + 1);
  const voters: Record<string, Statement["voters"][string]> = {};
  for (let j = 1; j <= 12; j++) {
    if (Math.random() > 0.3) {
      voters[u(j)] = voteOptions[Math.floor(Math.random() * voteOptions.length)];
    }
  }
  return makeStatement(id, text, author, voters);
});

const largeMerges: StatementMerge[] = [
  { id: "lm1", roomId: "room-demo", sourceStatementId: "l2", targetStatementId: "l1", creatorId: u(1), createdAt: new Date().toISOString() },
  { id: "lm2", roomId: "room-demo", sourceStatementId: "l8", targetStatementId: "l7", creatorId: u(1), createdAt: new Date().toISOString() },
];

export function VoteMatrixStory() {
  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <StoryContainer
        title="Vote Matrix"
        description="Displays how each participant voted on each statement"
        variants={[
          {
            id: "basic",
            label: "Basic",
            children: <VoteMatrix matrix={{ statements: basicStatements, merges: [] }} />,
          },
          {
            id: "merges",
            label: "With Merges",
            children: <VoteMatrix matrix={{ statements: mergeStatements, merges }} />,
          },
          {
            id: "large",
            label: "Large",
            children: <VoteMatrix matrix={{ statements: largeStatements, merges: largeMerges }} />,
          },
          {
            id: "empty",
            label: "Empty",
            children: <VoteMatrix matrix={{ statements: [], merges: [] }} />,
          },
        ]}
      />
    </div>
  );
}
