import { RoomScroller } from "../components/RoomScroller";
import type { UserPresence, VoteType } from "../types";
import { useState, useCallback, useEffect } from "react";
import { mockStatements, mockRooms } from "./mockData";
import { AvatarAnimal } from "../utils/constants/avatars";
import { StoryContainer } from "./StoryContainer";

export function DebateScrollerStory() {
  const handleSubmitStatement = async (roomId: string, text: string) => {
    console.log("Submit statement:", roomId, text);
    return { success: true };
  };

  const handleVoteOnStatement = async (statementId: string, voteType: VoteType) => {
    console.log("Vote on statement:", statementId, voteType);
    return { success: true };
  };

  const [presences, setPresences] = useState<UserPresence[]>([
    {
      userId: "user2",
      currentRoomIndex: 1,
      lastUpdated: Date.now(),
      avatarAnimal: "koala",
    },
    {
      userId: "user3",
      currentRoomIndex: 2,
      lastUpdated: Date.now(),
      avatarAnimal: "rhino",
    },
    {
      userId: "user4",
      currentRoomIndex: 0,
      lastUpdated: Date.now(),
      avatarAnimal: "elephant",
    },
    {
      userId: "user5",
      currentRoomIndex: 3,
      lastUpdated: Date.now(),
      avatarAnimal: "sloth",
    },
    {
      userId: "user6",
      currentRoomIndex: 1,
      lastUpdated: Date.now(),
      avatarAnimal: "panda",
    },
    {
      userId: "user7",
      currentRoomIndex: 2,
      lastUpdated: Date.now(),
      avatarAnimal: "monkey",
    },
    {
      userId: "user8",
      currentRoomIndex: 0,
      lastUpdated: Date.now(),
      avatarAnimal: "koala",
    },
  ]);

  const handleUpdatePresence = useCallback(
    (currentRoomIndex: number) => {
      setPresences((prev) => {
        const userId = "user2";
        const original = prev.find((p) => p.userId === userId);
        const filtered = prev.filter((p) => p.userId !== userId);
        return [
          ...filtered,
          {
            userId,
            currentRoomIndex,
            lastUpdated: Date.now(),
            avatarAnimal: original?.avatarAnimal || "monkey",
          },
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
            const avatars: AvatarAnimal[] = ["monkey", "koala", "rhino", "elephant", "sloth", "panda"];
            return [
              ...prev,
              {
                userId: newUser,
                currentRoomIndex: Math.floor(
                  Math.random() * mockRooms.length,
                ),
                lastUpdated: Date.now(),
                avatarAnimal: avatars[Math.floor(Math.random() * avatars.length)],
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
    <StoryContainer
      title="Debate Scroller"
      variants={[
        {
          id: "default",
          label: "Default",
          children: (
            <RoomScroller
              user={{} as any}
              rooms={mockRooms}
              events={[]}
              roomStatements={mockStatements}
              presences={presences}
              loading={false}
              currentSubHeard="food"
              isDeveloper={true}
              onJoinRoom={() => {}}
              onCreateRoom={() => {}}
              onSubmitStatement={handleSubmitStatement}
              onVoteOnStatement={handleVoteOnStatement}
              onUpdatePresence={handleUpdatePresence}
              onDiscussStatement={() => {}}
              onShowAccountSetupModal={() => {}}
              onOpenExplorer={() => {}}
            />
          ),
        },
        {
          id: "in-progress-results",
          label: "In-progress results",
          children: (
            <RoomScroller
              user={{ id: "user1" } as any}
              rooms={mockRooms}
              events={[]}
              roomStatements={Object.fromEntries(
                Object.entries(mockStatements).map(
                  ([roomId, stmts]) => [
                    roomId,
                    stmts.map((s) => ({
                      ...s,
                      voters: {
                        ...s.voters,
                        user1: "agree" as const,
                      },
                    })),
                  ],
                ),
              )}
              presences={[
                {
                  userId: "user2",
                  currentRoomIndex: 0,
                  lastUpdated: Date.now(),
                  avatarAnimal: "koala",
                },
                {
                  userId: "user3",
                  currentRoomIndex: 1,
                  lastUpdated: Date.now(),
                  avatarAnimal: "rhino",
                },
              ]}
              currentSubHeard="food"
              isDeveloper={true}
              loading={false}
              onJoinRoom={() => {}}
              onCreateRoom={() => {}}
              onSubmitStatement={handleSubmitStatement}
              onVoteOnStatement={handleVoteOnStatement}
              onUpdatePresence={() => {}}
              onDiscussStatement={() => {}}
              onShowAccountSetupModal={() => {}}
              onOpenExplorer={() => {}}
            />
          ),
        },
      ]}
    />
  );
}