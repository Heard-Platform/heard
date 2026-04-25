import { useState } from "react";
import { Button } from "../components/ui/button";
import { HideAndMergeModal } from "../components/room/mod/HideAndMergeModal";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { StoryContainer } from "./StoryContainer";
import type { Statement, StatementMerge } from "../types";

const mockStatements: Statement[] = [
  {
    id: "s1",
    text: "We should invest more in public transportation to reduce carbon emissions.",
    author: "user1",
    agrees: 12,
    disagrees: 3,
    passes: 2,
    superAgrees: 2,
    roomId: "room1",
    timestamp: Date.now() - 10000,
    round: 1,
    voters: { user2: "agree", user3: "disagree", user4: "super_agree" },
  },
  {
    id: "s2",
    text: "Public transit funding should be increased to cut down on car emissions.",
    author: "user2",
    agrees: 8,
    disagrees: 1,
    passes: 1,
    superAgrees: 1,
    roomId: "room1",
    timestamp: Date.now() - 9000,
    round: 1,
    voters: { user1: "agree", user5: "pass" },
  },
  {
    id: "s3",
    text: "Remote work should be a permanent option for office jobs.",
    author: "user3",
    agrees: 20,
    disagrees: 5,
    passes: 3,
    superAgrees: 4,
    roomId: "room1",
    timestamp: Date.now() - 8000,
    round: 1,
    voters: { user1: "super_agree", user2: "agree", user4: "disagree" },
  },
  {
    id: "s4",
    text: "Companies should allow employees to work from home permanently.",
    author: "user4",
    agrees: 15,
    disagrees: 4,
    passes: 2,
    superAgrees: 3,
    roomId: "room1",
    timestamp: Date.now() - 7000,
    round: 1,
    voters: { user3: "agree", user5: "disagree" },
  },
  {
    id: "s5",
    text: "Universal basic income would reduce poverty more effectively than current welfare programs.",
    author: "user5",
    agrees: 9,
    disagrees: 8,
    passes: 4,
    superAgrees: 1,
    roomId: "room1",
    timestamp: Date.now() - 6000,
    round: 2,
    voters: { user1: "disagree", user2: "agree" },
  },
];

const mockMerges: StatementMerge[] = [
  {
    id: "m1",
    roomId: "room1",
    sourceStatementId: "s2",
    targetStatementId: "s1",
    creatorId: "host1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "m2",
    roomId: "room1",
    sourceStatementId: "s4",
    targetStatementId: "s3",
    creatorId: "host1",
    createdAt: new Date().toISOString(),
  },
];

const mockStatementsWithHidden: Statement[] = [
  ...mockStatements.slice(0, 4),
  {
    ...mockStatements[4],
    isHidden: true,
    hiddenAt: Date.now() - 1000,
    hiddenBy: "host1",
  },
];

// s2 is the source of merge m1 (s2 → s1), here marked hidden
const mockStatementsWithHiddenMergeSource: Statement[] = mockStatements.map(
  (s) =>
    s.id === "s2"
      ? { ...s, isHidden: true, hiddenAt: Date.now() - 1000, hiddenBy: "host1" }
      : s,
);

// s1 is the target of merge m1, here marked hidden
const mockStatementsWithHiddenMergeTarget: Statement[] = mockStatements.map(
  (s) =>
    s.id === "s1"
      ? { ...s, isHidden: true, hiddenAt: Date.now() - 1000, hiddenBy: "host1" }
      : s,
);

function VariantInner({
  statements,
  merges,
  roomId,
}: {
  statements: Statement[];
  merges: StatementMerge[];
  roomId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const showcaseOverrides = {
    listStatementsForModeration: async () => statements,
    getStatementMerges: async () => merges,
    createStatementMerge: async (_roomId: string, sourceId: string, targetId: string) => ({
      success: true,
      data: {
        merge: {
          id: `merge-${Date.now()}`,
          roomId,
          sourceStatementId: sourceId,
          targetStatementId: targetId,
          creatorId: "host1",
          createdAt: new Date().toISOString(),
        },
      },
    }),
    deleteStatementMerge: async () => ({ success: true }),
    setStatementHidden: async (
      _roomId: string,
      _statementId: string,
      _isHidden: boolean,
    ) => ({ success: true }),
  };

  return (
    <DebateSessionProvider showcase showcaseOverrides={showcaseOverrides as any}>
      <div className="flex items-center gap-4">
        <Button onClick={() => setIsOpen(true)}>Open Hide and Merge</Button>
        <span className="text-sm text-muted-foreground">{statements.length} statements</span>
      </div>
      {isOpen && (
        <HideAndMergeModal roomId={roomId} onClose={() => setIsOpen(false)} />
      )}
    </DebateSessionProvider>
  );
}

export function HideAndMergeModalStory() {
  return (
    <StoryContainer
      title="Hide & Merge Modal"
      description="Host tool for hiding harmful responses and merging duplicates. Hidden rows are muted; tap duplicate (amber), tap canonical (green), confirm."
      variants={[
        {
          id: "default",
          label: "Default (5 statements, 2 merges)",
          children: (
            <VariantInner
              statements={mockStatements}
              merges={mockMerges}
              roomId="room1"
            />
          ),
        },
        {
          id: "with-hidden",
          label: "With a hidden statement",
          children: (
            <VariantInner
              statements={mockStatementsWithHidden}
              merges={[]}
              roomId="room1"
            />
          ),
        },
        {
          id: "hidden-merge-source",
          label: "Merge source is also hidden (s2 → s1)",
          children: (
            <VariantInner
              statements={mockStatementsWithHiddenMergeSource}
              merges={mockMerges}
              roomId="room1"
            />
          ),
        },
        {
          id: "hidden-merge-target",
          label: "Merge target is also hidden (s2 → s1)",
          children: (
            <VariantInner
              statements={mockStatementsWithHiddenMergeTarget}
              merges={mockMerges}
              roomId="room1"
            />
          ),
        },
      ]}
    />
  );
}
