import { useState } from "react";
import { RoomCard } from "../components/RoomCard";
import { StoryContainer } from "./StoryContainer";
import { mockRooms, mockStatements } from "./mockData";
import { RoomAlertsProvider } from "../contexts/RoomAlertsContext";
import { Toaster } from "../components/ui/sonner";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import type { Statement, VoteType, UserSession } from "../types";

const mockUser: UserSession = {
  id: "story-user",
  nickname: "StoryUser",
  email: "story@example.com",
  score: 42,
  streak: 3,
  lastActive: Date.now(),
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
};

const activeRoom = mockRooms[0];
const activeStatements = mockStatements[activeRoom.id] ?? [];

const completedRoom = {
  ...mockRooms[3],
  phase: "results" as const,
};
const completedStatements = mockStatements[mockRooms[3].id] ?? [];

const noCoverRoom = mockRooms[1];
const noCoverStatements: Statement[] = [
  {
    id: "no-cover-stmt1",
    text: "Remote work saves commute time and increases productivity",
    author: "user2",
    roomId: noCoverRoom.id,
    timestamp: Date.now() - 12 * 60 * 1000,
    agrees: 8,
    disagrees: 2,
    passes: 1,
    superAgrees: 3,
    voters: { user2: "agree", user3: "agree", user4: "disagree" },
    round: 1,
  },
  {
    id: "no-cover-stmt2",
    text: "Without a commute, the workday bleeds into personal time",
    author: "user3",
    roomId: noCoverRoom.id,
    timestamp: Date.now() - 10 * 60 * 1000,
    agrees: 4,
    disagrees: 6,
    passes: 0,
    superAgrees: 0,
    voters: { user2: "disagree", user4: "agree" },
    round: 1,
  },
  {
    id: "no-cover-stmt3",
    text: "Async collaboration tools have mostly closed the gap with in-office work",
    author: "user4",
    roomId: noCoverRoom.id,
    timestamp: Date.now() - 8 * 60 * 1000,
    agrees: 11,
    disagrees: 1,
    passes: 2,
    superAgrees: 5,
    voters: { user2: "agree", user3: "agree" },
    round: 1,
  },
  {
    id: "no-cover-stmt4",
    text: "New hires struggle to build relationships without in-person time",
    author: "user1",
    roomId: noCoverRoom.id,
    timestamp: Date.now() - 6 * 60 * 1000,
    agrees: 7,
    disagrees: 3,
    passes: 1,
    superAgrees: 1,
    voters: { user4: "agree" },
    round: 1,
  },
  {
    id: "no-cover-stmt5",
    text: "Companies save real money on office space with remote teams",
    author: "user2",
    roomId: noCoverRoom.id,
    timestamp: Date.now() - 4 * 60 * 1000,
    agrees: 5,
    disagrees: 0,
    passes: 0,
    superAgrees: 2,
    voters: {},
    round: 1,
  },
];

function RoomCardWrapper({
  room,
  statements,
  loadingStatements = false,
}: {
  room: typeof activeRoom;
  statements: typeof activeStatements;
  loadingStatements?: boolean;
}) {
  const [localStatements, setLocalStatements] = useState(statements);

  const handleVote = async (statement: Statement, voteType: VoteType) => {
    console.log("Vote:", { statementId: statement.id, voteType });
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLocalStatements((prev) =>
      prev.map((s) =>
        s.id === statement.id
          ? { ...s, voters: { ...s.voters, [mockUser.id]: voteType } }
          : s,
      ),
    );
  };

  return (
    <DebateSessionProvider showcaseOverrides={{ safelyGetUser: () => mockUser }}>
      <div className="bg-slate-100 rounded-lg p-6 flex justify-center">
        <div className="w-full max-w-md">
          <RoomCard
            room={room}
            statements={localStatements}
            loadingStatements={loadingStatements}
            isDeveloper={true}
            isActive={true}
            user={mockUser}
            currentSubHeard={undefined}
            onSubmitStatement={async (roomId, text) => {
              console.log("Submit:", { roomId, text });
            }}
            onVoteOnStatement={handleVote}
            onRefreshStatements={async () => {
              console.log("Refresh statements");
            }}
            onDiscussStatement={(text) => console.log("Discuss:", text)}
            onShowAccountSetupModal={(feature) =>
              console.log("Account setup:", feature)
            }
            onSubHeardChange={(subHeard) =>
              console.log("Subheard change:", subHeard)
            }
          />
        </div>
      </div>
    </DebateSessionProvider>
  );
}

export function RoomCardStory() {
  return (
    <RoomAlertsProvider>
      <Toaster />
      <StoryContainer
        title="Room Card"
        description="The main post card with swipeable statement stack"
        variants={[
          {
            id: "active",
            label: "Active",
            children: (
              <RoomCardWrapper room={activeRoom} statements={activeStatements} />
            ),
          },
          {
            id: "completed",
            label: "Completed",
            children: (
              <RoomCardWrapper
                room={completedRoom}
                statements={completedStatements}
              />
            ),
          },
          {
            id: "loading",
            label: "Loading",
            children: (
              <RoomCardWrapper
                room={activeRoom}
                statements={[]}
                loadingStatements={true}
              />
            ),
          },
          {
            id: "empty",
            label: "No responses",
            children: (
              <RoomCardWrapper room={activeRoom} statements={[]} />
            ),
          },
          {
            id: "no-cover-multi",
            label: "No cover, multiple statements",
            children: (
              <RoomCardWrapper
                room={noCoverRoom}
                statements={noCoverStatements}
              />
            ),
          },
        ]}
      />
    </RoomAlertsProvider>
  );
}
