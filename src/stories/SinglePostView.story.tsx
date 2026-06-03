import { useState } from "react";
import { SinglePostView } from "../components/SinglePostView";
import { StoryContainer } from "./StoryContainer";
import { mockRooms, mockStatements } from "./mockData";
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

const completedRoom = { ...mockRooms[3], phase: "results" as const };
const completedStatements = mockStatements[mockRooms[3].id] ?? [];

function SinglePostViewWrapper({
  room,
  statements,
  loadingStatements = false,
}: {
  room: typeof activeRoom;
  statements: typeof activeStatements;
  loadingStatements?: boolean;
}) {
  const [localStatements, setLocalStatements] = useState(statements);
  const [currentSubHeard, setCurrentSubHeard] = useState<string | undefined>(
    room.subHeard,
  );

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
    <SinglePostView
      room={room}
      statements={localStatements}
      loadingStatements={loadingStatements}
      user={mockUser}
      currentSubHeard={currentSubHeard}
      isDeveloper={true}
      onSubmitStatement={async (roomId, text) => {
        console.log("Submit:", { roomId, text });
      }}
      onVoteOnStatement={handleVote}
      onRefreshStatements={async () => {
        console.log("Refresh statements");
      }}
      onSubHeardChange={setCurrentSubHeard}
      onUpdateSubHeard={async () => false}
      onShowAccountSetupModal={(feature) =>
        console.log("Account setup:", feature)
      }
      onOpenExplorer={() => console.log("Open explorer")}
      onDiscussStatement={(text) => console.log("Discuss:", text)}
      onLogout={() => console.log("Logout")}
      onOpenHelp={() => console.log("Open help")}
      onOpenFeatureTracker={() => console.log("Open feature tracker")}
      onJumpToRoom={(roomId) => console.log("Jump to room:", roomId)}
    />
  );
}

export function SinglePostViewStory() {
  return (
    <>
      <Toaster />
      <StoryContainer
        title="Single Post View"
        description="Full-page view for a single post with header and RoomCard"
        variants={[
          {
            id: "active",
            label: "Active",
            children: (
              <SinglePostViewWrapper
                room={activeRoom}
                statements={activeStatements}
              />
            ),
          },
          {
            id: "completed",
            label: "Completed",
            children: (
              <SinglePostViewWrapper
                room={completedRoom}
                statements={completedStatements}
              />
            ),
          },
          {
            id: "loading",
            label: "Loading",
            children: (
              <SinglePostViewWrapper
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
              <SinglePostViewWrapper room={activeRoom} statements={[]} />
            ),
          },
        ]}
      />
    </>
  );
}
