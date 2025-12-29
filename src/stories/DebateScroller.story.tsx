import { RoomScroller } from "../components/RoomScroller";
import type {
  DebateRoom,
  Statement,
  UserPresence,
  VoteType,
} from "../types";
import { useState, useCallback, useEffect } from "react";

export function DebateScrollerStory() {
  const mockRooms: DebateRoom[] = [
    {
      id: "debate-with-image",
      topic:
        "Pineapple belongs on pizza and anyone who disagrees is living in denial",
      phase: "round1",
      subPhase: "posting",
      gameNumber: 1,
      roundStartTime: Date.now() - 5 * 60 * 1000,
      participants: [
        "user1",
        "user2",
        "user3",
        "user4",
        "user5",
      ],
      hostId: "user1",
      isActive: true,
      createdAt: Date.now() - 10 * 60 * 1000,
      mode: "realtime",
      rantFirst: true,
      endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
      subHeard: "food",
      imageUrl:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80", // Pizza image
    },
    {
      id: "debate-no-image",
      topic:
        "Remote work is objectively better than office work",
      phase: "round1",
      subPhase: "voting",
      gameNumber: 1,
      roundStartTime: Date.now() - 15 * 60 * 1000,
      participants: ["user1", "user2", "user3"],
      hostId: "user2",
      isActive: true,
      createdAt: Date.now() - 20 * 60 * 1000,
      mode: "realtime",
      rantFirst: true,
      endTime: Date.now() + 6 * 24 * 60 * 60 * 1000,
      subHeard: "work",
    },
    {
      id: "debate-with-image-2",
      topic:
        "Cats are superior pets to dogs in every measurable way",
      phase: "round1",
      subPhase: "posting",
      gameNumber: 1,
      roundStartTime: Date.now() - 3 * 60 * 1000,
      participants: ["user1", "user2"],
      hostId: "user3",
      isActive: true,
      createdAt: Date.now() - 8 * 60 * 1000,
      mode: "realtime",
      rantFirst: true,
      endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
      subHeard: "pets",
      imageUrl:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80", // Cat image
    },
    {
      id: "debate-with-image-3",
      topic:
        "Electric cars will completely replace gas cars within the next decade",
      phase: "round1",
      subPhase: "results",
      gameNumber: 1,
      roundStartTime: Date.now() - 25 * 60 * 1000,
      participants: [
        "user1",
        "user2",
        "user3",
        "user4",
        "user5",
        "user6",
        "user7",
      ],
      hostId: "user4",
      isActive: true,
      createdAt: Date.now() - 30 * 60 * 1000,
      mode: "realtime",
      rantFirst: true,
      endTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
      subHeard: "technology",
      imageUrl:
        "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80", // Electric car image
    },
  ];

  const mockStatements: Record<string, Statement[]> = {
    "debate-with-image": [
      {
        id: "stmt1",
        text: "Pineapple adds a sweet contrast to the savory flavors",
        author: "user1",
        roomId: "debate-with-image",
        createdAt: Date.now() - 4 * 60 * 1000,
        agrees: 3,
        disagrees: 1,
        passes: 0,
        superAgrees: 1,
        voters: {},
      },
    ],
    "debate-no-image": [
      {
        id: "stmt2",
        text: "Remote work saves commute time and increases productivity",
        author: "user2",
        roomId: "debate-no-image",
        createdAt: Date.now() - 12 * 60 * 1000,
        agrees: 2,
        disagrees: 0,
        passes: 1,
        superAgrees: 0,
        voters: {},
      },
    ],
  };

  const handleJoinRoom = (roomId: string) => {
    console.log("Join room:", roomId);
  };

  const handleCreateRoom = () => {
    console.log("Create room");
  };

  const handleSetRoomInactive = async (roomId: string) => {
    console.log("Set room inactive:", roomId);
    return true;
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
      console.log("Update presence:", userId, currentRoomIndex);
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
          rooms={mockRooms}
          roomStatements={mockStatements}
          presences={presences}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onSubmitStatement={handleSubmitStatement}
          onVoteOnStatement={handleVoteOnStatement}
          onGetRoomStatements={handleGetRoomStatements}
          onGetAllRoomStatements={handleGetAllRoomStatements}
          onUpdatePresence={handleUpdatePresence}
          isDeveloper={true}
          loading={false}
          currentUserId="user1"
          currentSubHeard="food"
          onDiscussStatement={handleDiscussStatement}
        />
      </div>
    </div>
  );
}