import { useState } from "react";
import { StatementVotesTable } from "../components/analysis/StatementVotesTable";
import { StatementVotes } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

type TagRef = { id: string; name: string };

function StatefulStatementVotesTable(props: {
  statements: StatementVotes[];
  totalParticipants: number;
  clusterSizes: number[];
  seed?: boolean;
}) {
  const [showNumbers, setShowNumbers] = useState(false);
  const [isModerator, setIsModerator] = useState(true);
  const seed = props.seed ?? true;
  const seedTags: Record<string, TagRef[]> = seed
    ? {
        "s-1": [{ id: "seed-actionable", name: "actionable" }],
        "s-3": [
          { id: "seed-needs-clarification", name: "needs clarification" },
          { id: "seed-actionable-2", name: "actionable" },
        ],
      }
    : {};
  const [tagsByStatementId, setTagsByStatementId] = useState<Record<string, TagRef[]>>(() =>
    Object.fromEntries(props.statements.map((s) => [s.id, s.tags ?? seedTags[s.id] ?? []])),
  );

  const statements = props.statements.map((s) => ({
    ...s,
    tags: tagsByStatementId[s.id] ?? [],
  }));

  const availableTagNames = Array.from(
    new Set(Object.values(tagsByStatementId).flatMap((tags) => tags.map((t) => t.name))),
  ).sort();

  const handleAddTag = async (statementId: string, name: string) => {
    setTagsByStatementId((prev) => {
      const existing = prev[statementId] ?? [];
      if (existing.some((t) => t.name === name)) return prev;
      return {
        ...prev,
        [statementId]: [...existing, { id: `${statementId}-${name}-${Date.now()}`, name }],
      };
    });
    return true;
  };

  const handleRemoveTag = async (statementId: string, tagId: string) => {
    setTagsByStatementId((prev) => ({
      ...prev,
      [statementId]: (prev[statementId] ?? []).filter((t) => t.id !== tagId),
    }));
    return true;
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={isModerator}
          onChange={(e) => setIsModerator(e.target.checked)}
        />
        Moderator mode (tag editing enabled)
      </label>
      <StatementVotesTable
        statements={statements}
        totalParticipants={props.totalParticipants}
        clusterSizes={props.clusterSizes}
        showNumbers={showNumbers}
        onShowNumbersChange={setShowNumbers}
        isModerator={isModerator}
        availableTagNames={availableTagNames}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />
    </div>
  );
}

export default {
  title: "Analysis/StatementVotesTable",
};

const clusterSizes = [80, 60, 50, 35];
const totalParticipants = 225;

const mockStatements: StatementVotes[] = [
  {
    id: "s-1",
    text: "We should invest more in renewable energy infrastructure to reduce our carbon footprint and create green jobs for the future.",
    agreeVotes: 180,
    rawAgreeVotes: 142,
    superAgreeVotes: 38,
    disagreeVotes: 23,
    passVotes: 15,
    totalVotes: 218,
    consensusScore: 65.1,
    mergedFrom: [],
    clusterVotes: [
      { clusterId: 0, clusterSize: 80, agreeVotes: 72, superAgreeVotes: 15, disagreeVotes: 2, passVotes: 4 },
      { clusterId: 1, clusterSize: 60, agreeVotes: 55, superAgreeVotes: 12, disagreeVotes: 2, passVotes: 3 },
      { clusterId: 2, clusterSize: 50, agreeVotes: 37, superAgreeVotes: 8, disagreeVotes: 8, passVotes: 4 },
      { clusterId: 3, clusterSize: 35, agreeVotes: 16, superAgreeVotes: 3, disagreeVotes: 11, passVotes: 4 },
    ],
  },
  {
    id: "s-2",
    text: "Public transportation improvements should be prioritized over expanding highway systems.",
    agreeVotes: 110,
    rawAgreeVotes: 98,
    superAgreeVotes: 12,
    disagreeVotes: 45,
    passVotes: 22,
    totalVotes: 177,
    consensusScore: 55.4,
    mergedFrom: [
      { id: "s-2m-1", text: "We should invest heavily in buses and trains to reduce private car usage." },
      { id: "s-2m-2", text: "Light rail and subway expansion should be a budget priority." },
    ],
    clusterVotes: [
      { clusterId: 0, clusterSize: 80, agreeVotes: 55, superAgreeVotes: 6, disagreeVotes: 10, passVotes: 8 },
      { clusterId: 1, clusterSize: 60, agreeVotes: 35, superAgreeVotes: 4, disagreeVotes: 12, passVotes: 6 },
      { clusterId: 2, clusterSize: 50, agreeVotes: 15, superAgreeVotes: 2, disagreeVotes: 18, passVotes: 5 },
      { clusterId: 3, clusterSize: 35, agreeVotes: 5, superAgreeVotes: 0, disagreeVotes: 5, passVotes: 3 },
    ],
  },
  {
    id: "s-3",
    text: "Community gardens and urban green spaces contribute significantly to neighborhood wellbeing.",
    agreeVotes: 96,
    rawAgreeVotes: 87,
    superAgreeVotes: 9,
    disagreeVotes: 31,
    passVotes: 28,
    totalVotes: 155,
    consensusScore: 56.1,
    mergedFrom: [],
    clusterVotes: [
      { clusterId: 0, clusterSize: 80, agreeVotes: 48, superAgreeVotes: 5, disagreeVotes: 10, passVotes: 10 },
      { clusterId: 1, clusterSize: 60, agreeVotes: 30, superAgreeVotes: 3, disagreeVotes: 8, passVotes: 8 },
      { clusterId: 2, clusterSize: 50, agreeVotes: 15, superAgreeVotes: 1, disagreeVotes: 8, passVotes: 6 },
      { clusterId: 3, clusterSize: 35, agreeVotes: 3, superAgreeVotes: 0, disagreeVotes: 5, passVotes: 4 },
    ],
  },
  {
    id: "s-4",
    text: "We should completely ban cars in the downtown core to prioritize pedestrian spaces.",
    agreeVotes: 23,
    rawAgreeVotes: 18,
    superAgreeVotes: 5,
    disagreeVotes: 112,
    passVotes: 25,
    totalVotes: 160,
    consensusScore: 11.3,
    mergedFrom: [],
    clusterVotes: [
      { clusterId: 0, clusterSize: 80, agreeVotes: 12, superAgreeVotes: 3, disagreeVotes: 50, passVotes: 10 },
      { clusterId: 1, clusterSize: 60, agreeVotes: 8, superAgreeVotes: 2, disagreeVotes: 35, passVotes: 8 },
      { clusterId: 2, clusterSize: 50, agreeVotes: 2, superAgreeVotes: 0, disagreeVotes: 20, passVotes: 5 },
      { clusterId: 3, clusterSize: 35, agreeVotes: 1, superAgreeVotes: 0, disagreeVotes: 7, passVotes: 2 },
    ],
  },
  {
    id: "s-5",
    text: "Property taxes should be tripled to fund ambitious green initiatives.",
    agreeVotes: 25,
    rawAgreeVotes: 22,
    superAgreeVotes: 3,
    disagreeVotes: 96,
    passVotes: 14,
    totalVotes: 135,
    consensusScore: 16.3,
    mergedFrom: [],
    clusterVotes: [
      { clusterId: 0, clusterSize: 80, agreeVotes: 12, superAgreeVotes: 2, disagreeVotes: 42, passVotes: 5 },
      { clusterId: 1, clusterSize: 60, agreeVotes: 8, superAgreeVotes: 1, disagreeVotes: 30, passVotes: 4 },
      { clusterId: 2, clusterSize: 50, agreeVotes: 4, superAgreeVotes: 0, disagreeVotes: 18, passVotes: 3 },
      { clusterId: 3, clusterSize: 35, agreeVotes: 1, superAgreeVotes: 0, disagreeVotes: 6, passVotes: 2 },
    ],
  },
  {
    id: "s-6",
    text: "All parking lots should be converted to housing developments immediately.",
    agreeVotes: 17,
    rawAgreeVotes: 15,
    superAgreeVotes: 2,
    disagreeVotes: 78,
    passVotes: 19,
    totalVotes: 114,
    consensusScore: 13.2,
    mergedFrom: [],
    clusterVotes: [
      { clusterId: 0, clusterSize: 80, agreeVotes: 8, superAgreeVotes: 1, disagreeVotes: 35, passVotes: 8 },
      { clusterId: 1, clusterSize: 60, agreeVotes: 5, superAgreeVotes: 1, disagreeVotes: 22, passVotes: 6 },
      { clusterId: 2, clusterSize: 50, agreeVotes: 3, superAgreeVotes: 0, disagreeVotes: 15, passVotes: 3 },
      { clusterId: 3, clusterSize: 35, agreeVotes: 1, superAgreeVotes: 0, disagreeVotes: 6, passVotes: 2 },
    ],
  },
  {
    id: "s-7",
    text: "Local food production should be subsidized to reduce reliance on imported goods.",
    agreeVotes: 92,
    rawAgreeVotes: 74,
    superAgreeVotes: 18,
    disagreeVotes: 41,
    passVotes: 20,
    totalVotes: 153,
    consensusScore: 48.4,
    mergedFrom: [],
    clusterVotes: [
      { clusterId: 0, clusterSize: 80, agreeVotes: 45, superAgreeVotes: 9, disagreeVotes: 12, passVotes: 7 },
      { clusterId: 1, clusterSize: 60, agreeVotes: 30, superAgreeVotes: 6, disagreeVotes: 10, passVotes: 6 },
      { clusterId: 2, clusterSize: 50, agreeVotes: 15, superAgreeVotes: 3, disagreeVotes: 12, passVotes: 4 },
      { clusterId: 3, clusterSize: 35, agreeVotes: 2, superAgreeVotes: 0, disagreeVotes: 7, passVotes: 3 },
    ],
  },
  {
    id: "s-8",
    text: "Schools should teach environmental stewardship as a core curriculum subject.",
    agreeVotes: 154,
    rawAgreeVotes: 110,
    superAgreeVotes: 44,
    disagreeVotes: 19,
    passVotes: 11,
    totalVotes: 184,
    consensusScore: 59.8,
    mergedFrom: [],
    clusterVotes: [
      { clusterId: 0, clusterSize: 80, agreeVotes: 65, superAgreeVotes: 19, disagreeVotes: 4, passVotes: 3 },
      { clusterId: 1, clusterSize: 60, agreeVotes: 48, superAgreeVotes: 14, disagreeVotes: 4, passVotes: 3 },
      { clusterId: 2, clusterSize: 50, agreeVotes: 30, superAgreeVotes: 9, disagreeVotes: 5, passVotes: 3 },
      { clusterId: 3, clusterSize: 35, agreeVotes: 11, superAgreeVotes: 2, disagreeVotes: 6, passVotes: 2 },
    ],
  },
];

export const Default = () => (
  <div className="p-4 max-w-6xl mx-auto">
    <StatefulStatementVotesTable
      statements={mockStatements}
      totalParticipants={totalParticipants}
      clusterSizes={clusterSizes}
    />
  </div>
);

export const WithoutClusters = () => (
  <div className="p-4 max-w-4xl mx-auto">
    <StatefulStatementVotesTable
      statements={mockStatements.map(
        ({ clusterVotes: _cv, ...rest }) => ({
          clusterVotes: [],
          ...rest,
        }),
      )}
      totalParticipants={totalParticipants}
      clusterSizes={[]}
    />
  </div>
);

export const Empty = () => (
  <div className="p-4 max-w-4xl mx-auto">
    <StatefulStatementVotesTable
      statements={[]}
      totalParticipants={0}
      clusterSizes={[]}
    />
  </div>
);

export function StatementVotesTableStory() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statement Votes Table</CardTitle>
          <CardDescription>
            Sortable breakdown of all statements and their vote counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatefulStatementVotesTable
            statements={mockStatements}
            totalParticipants={totalParticipants}
            clusterSizes={clusterSizes}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statement Votes Table (no tags yet)</CardTitle>
          <CardDescription>
            Room has zero existing tags — every "+ tag" popover starts with no suggestions,
            only the "Create ..." option once you type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatefulStatementVotesTable
            statements={mockStatements}
            totalParticipants={totalParticipants}
            clusterSizes={clusterSizes}
            seed={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
