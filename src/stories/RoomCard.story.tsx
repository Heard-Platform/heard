import { useState } from "react";
import { RoomCard } from "../components/RoomCard";
import { StoryContainer } from "./StoryContainer";
import { mockRooms, mockStatements } from "./mockData";
import { RoomAlertsProvider } from "../contexts/RoomAlertsContext";
import { Toaster } from "../components/ui/sonner";
import type { VoteType, UserSession } from "../types";

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

  const handleVote = async (statementId: string, voteType: VoteType) => {
    console.log("Vote:", { statementId, voteType });
    setLocalStatements((prev) =>
      prev.map((s) =>
        s.id === statementId
          ? { ...s, voters: { ...s.voters, [mockUser.id]: voteType } }
          : s,
      ),
    );
  };

  return (
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
          onJoin={() => console.log("join")}
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
        ]}
      />
    </RoomAlertsProvider>
  );
}
