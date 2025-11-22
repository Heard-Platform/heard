import { RoomScroller } from "../components/RoomScroller";
import type { DebateRoom } from "../types";
import { unsplash_tool } from "../utils/unsplash";

export function DebateScrollerStory() {
  // Mock debate rooms with and without images
  const mockRooms: DebateRoom[] = [
    {
      id: "debate-with-image",
      topic: "Pineapple belongs on pizza and anyone who disagrees is living in denial",
      phase: "round1",
      subPhase: "posting",
      gameNumber: 1,
      roundStartTime: Date.now() - 5 * 60 * 1000,
      participants: ["user1", "user2", "user3", "user4", "user5"],
      hostId: "user1",
      isActive: true,
      createdAt: Date.now() - 10 * 60 * 1000,
      mode: "realtime",
      rantFirst: true,
      endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
      subHeard: "food",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80", // Pizza image
    },
    {
      id: "debate-no-image",
      topic: "Remote work is objectively better than office work",
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
      topic: "Cats are superior pets to dogs in every measurable way",
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
      imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80", // Cat image
    },
    {
      id: "debate-with-image-3",
      topic: "Electric cars will completely replace gas cars within the next decade",
      phase: "round1",
      subPhase: "results",
      gameNumber: 1,
      roundStartTime: Date.now() - 25 * 60 * 1000,
      participants: ["user1", "user2", "user3", "user4", "user5", "user6", "user7"],
      hostId: "user4",
      isActive: true,
      createdAt: Date.now() - 30 * 60 * 1000,
      mode: "realtime",
      rantFirst: true,
      endTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
      subHeard: "technology",
      imageUrl: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80", // Electric car image
    },
  ];

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

  const handleDiscussStatement = (statementText: string, subHeard?: string) => {
    console.log("Discuss statement:", statementText, subHeard);
  };

  return (
    <div className="space-y-6">
      {/* Mock scroller container */}
      <div className="bg-slate-100 rounded-lg overflow-hidden" style={{ height: "600px" }}>
        <RoomScroller
          rooms={mockRooms}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onSetRoomInactive={handleSetRoomInactive}
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