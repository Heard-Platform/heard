import { RoomScroller } from "../components/RoomScroller";
import type {
  UserPresence,
  VoteType
} from "../types";
import { useState, useCallback, useEffect } from "react";
import { mockStatements, mockRooms } from "./mockData";

export function DebateScrollerStory() {
  const handleJoinRoom = (roomId: string) => {
    console.log("Join room:", roomId);
  };

  const handleCreateRoom = () => {
    console.log("Create room");
  };

  const handleDiscussStatement = (
    statementText: string,
    subHeard?: string,
  ) => {
    console.log("Discuss statement:", statementText, subHeard);
  };

  const handleSubmitStatement = async (
    roomId: string,
    text: string,
  ) => {
    console.log("Submit statement:", roomId, text);
    return { success: true };
  };

  const handleVoteOnStatement = async (
    statementId: string,
    voteType: VoteType,
  ) => {
    console.log("Vote on statement:", statementId, voteType);
    return { success: true };
  };

  const handleGetRoomStatements = async (roomId: string) => {
    return mockStatements[roomId] || [];
  };

  const handleGetAllRoomStatements = async () => {
    console.log("Get all room statements");
    return mockStatements;
  };

  const [presences, setPresences] = useState<UserPresence[]>([
    {
      userId: "user2",
      currentRoomIndex: 1,
      lastUpdated: Date.now(),
    },
    {
      userId: "user3",
      currentRoomIndex: 2,
      lastUpdated: Date.now(),
    },
    {
      userId: "user4",
      currentRoomIndex: 0,
      lastUpdated: Date.now(),
    },
    {
      userId: "user5",
      currentRoomIndex: 3,
      lastUpdated: Date.now(),
    },
    {
      userId: "user6",
      currentRoomIndex: 1,
      lastUpdated: Date.now(),
    },
    {
      userId: "user7",
      currentRoomIndex: 2,
      lastUpdated: Date.now(),
    },
    {
      userId: "user8",
      currentRoomIndex: 0,
      lastUpdated: Date.now(),
    },
  ]);

  const handleUpdatePresence = useCallback(
    (userId: string, currentRoomIndex: number) => {
      setPresences((prev) => {
        const filtered = prev.filter(
          (p) => p.userId !== userId,
        );
        return [
          ...filtered,
          { userId, currentRoomIndex, lastUpdated: Date.now() },
        ];
      });
    },
    [],
  );

  useEffect(() => {
    const updateRandomPresence = () => {
      setPresences((prev) => {
        if (prev.length === 0) return prev;

        const shouldAddRemoveUser = Math.random() < 0.2;

        if (shouldAddRemoveUser) {
          const existingUsers = new Set(
            prev.map((p) => p.userId),
          );
          const allPossibleUsers = [
            "user2",
            "user3",
            "user4",
            "user5",
            "user6",
            "user7",
            "user8",
            "user9",
            "user10",
            "user11",
            "user12",
          ];
          const availableUsers = allPossibleUsers.filter(
            (u) => !existingUsers.has(u),
          );

          if (Math.random() < 0.5 && prev.length > 1) {
            const randomIndex = Math.floor(
              Math.random() * prev.length,
            );
            return prev.filter((_, i) => i !== randomIndex);
          } else if (availableUsers.length > 0) {
            const newUser =
              availableUsers[
                Math.floor(
                  Math.random() * availableUsers.length,
                )
              ];
            return [
              ...prev,
              {
                userId: newUser,
                currentRoomIndex: Math.floor(
                  Math.random() * mockRooms.length,
                ),
                lastUpdated: Date.now(),
              },
            ];
          }
        }

        const randomIndex = Math.floor(
          Math.random() * prev.length,
        );
        const randomUser = prev[randomIndex];
        const newRoomIndex = Math.floor(
          Math.random() * mockRooms.length,
        );

        return prev.map((p, i) =>
          i === randomIndex
            ? {
                ...p,
                currentRoomIndex: newRoomIndex,
                lastUpdated: Date.now(),
              }
            : p,
        );
      });
    };

    const interval = setInterval(updateRandomPresence, 2500);

    return () => clearInterval(interval);
  }, [mockRooms.length]);

  return (
    <div className="space-y-6">
      {/* Mock scroller container */}
      <div
        className="bg-slate-100 rounded-lg overflow-hidden"
        style={{ height: "600px" }}
      >
        <RoomScroller
          user={{} as any}
          rooms={mockRooms}
          roomStatements={mockStatements}
          presences={presences}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onSubmitStatement={handleSubmitStatement}
          onVoteOnStatement={handleVoteOnStatement}
          onUpdatePresence={handleUpdatePresence}
          isDeveloper={true}
          loading={false}
          currentSubHeard="food"
          onDiscussStatement={handleDiscussStatement}
          onShowAccountSetupModal={() => {}}
        />
      </div>
    </div>
  );
}