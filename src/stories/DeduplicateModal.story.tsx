import { useState } from "react";
import { Button } from "../components/ui/button";
import { DeduplicateModal } from "../components/room/DeduplicateModal";
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
  {
    id: "m3",
    roomId: "room1",
    sourceStatementId: "s5",
    targetStatementId: "s3",
    creatorId: "host1",
    createdAt: new Date().toISOString(),
  },
];

const topics = [
  "The city should ban single-use plastics at restaurants and grocery stores.",
  "Public libraries should offer free coding classes for adults.",
  "All new buildings should be required to install solar panels.",
  "The school day should start at 9am instead of 7:30am.",
  "Local parks need more lighting to be safe at night.",
  "Bus routes should run 24 hours on weekends.",
  "The downtown farmer's market should happen twice a week.",
  "Businesses should be required to pay a living wage of at least $20/hr.",
  "The city should convert empty office buildings into affordable housing.",
  "Bike lanes should be physically separated from traffic with barriers.",
  "Every neighborhood should have a community garden.",
  "Street parking on main commercial corridors should be replaced with outdoor seating.",
  "The city should invest in more electric vehicle charging stations.",
  "High school students should have a personal finance class requirement.",
  "Local elections should be moved to the same day as national elections to boost turnout.",
  "The city should offer free public wifi in all parks.",
  "There should be a tax incentive for businesses that hire locally.",
  "The public transit system should be free for riders under 18.",
  "Historic buildings should be preserved even if it raises development costs.",
  "Sidewalk repair costs should be covered by the city, not individual homeowners.",
  "Short-term rentals like Airbnb should require a special permit.",
  "Food trucks should be allowed to operate in more neighborhoods.",
  "The city should plant more street trees to reduce urban heat.",
  "Zoning laws should allow for more mixed-use development.",
  "Police should be required to wear body cameras at all times on duty.",
  "The city should fund more mental health crisis response teams.",
  "Community college should be free for residents of the city.",
  "Sports stadiums should not receive public subsidies.",
  "Landlords should be required to disclose a unit's previous rent before leasing.",
  "The city should require composting alongside recycling and trash pickup.",
];

const largeMockMerges: StatementMerge[] = [
  {
    id: "lm1",
    roomId: "room2",
    sourceStatementId: "ls6",
    targetStatementId: "ls1",
    creatorId: "host1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lm2",
    roomId: "room2",
    sourceStatementId: "ls14",
    targetStatementId: "ls1",
    creatorId: "host1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lm3",
    roomId: "room2",
    sourceStatementId: "ls22",
    targetStatementId: "ls20",
    creatorId: "host1",
    createdAt: new Date().toISOString(),
  },
];

const largeMockStatements: Statement[] = topics.map((text, i) => ({
  id: `ls${i + 1}`,
  text,
  author: `user${(i % 10) + 1}`,
  agrees: Math.floor(Math.random() * 20) + 2,
  disagrees: Math.floor(Math.random() * 10),
  passes: Math.floor(Math.random() * 5),
  superAgrees: Math.floor(Math.random() * 4),
  roomId: "room2",
  timestamp: Date.now() - i * 1000,
  round: i < 15 ? 1 : 2,
  voters: {},
}));

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
    getRoomStatements: async () => statements,
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
  };

  return (
    <DebateSessionProvider showcase showcaseOverrides={showcaseOverrides as any}>
      <div className="flex items-center gap-4">
        <Button onClick={() => setIsOpen(true)}>Open Manage Duplicates</Button>
        <span className="text-sm text-muted-foreground">{statements.length} statements</span>
      </div>
      {isOpen && (
        <DeduplicateModal roomId={roomId} onClose={() => setIsOpen(false)} />
      )}
    </DebateSessionProvider>
  );
}

export function DeduplicateModalStory() {
  return (
    <StoryContainer
      title="Deduplicate Modal"
      description="Host tool for merging duplicate statements. Tap duplicate (amber), tap canonical (green), confirm."
      variants={[
        {
          id: "default",
          label: "Default (5 statements, 3 merges)",
          children: (
            <VariantInner
              statements={mockStatements}
              merges={mockMerges}
              roomId="room1"
            />
          ),
        },
        {
          id: "large",
          label: "Large (30 statements, no merges)",
          children: (
            <VariantInner
              statements={largeMockStatements}
              merges={largeMockMerges}
              roomId="room2"
            />
          ),
        },
      ]}
    />
  );
}
