import { DebateRoom } from "./types.tsx";

type RoomPartial = Pick<
  DebateRoom,
  | "id"
  | "topic"
  | "hostId"
  | "participants"
  | "hostId"
  | "subHeard"
  | "endTime"
  | "imageUrl"
  | "youtubeUrl"
  | "allowAnonymous"
>;

export const createNewRoomData = (
  roomPartial: RoomPartial,
): DebateRoom => {
  return {
    id: roomPartial.id,
    topic: roomPartial.topic,
    phase: "round1",
    subPhase: "posting",
    gameNumber: 1,
    roundStartTime: Date.now(),
    participants: roomPartial.participants,
    hostId: roomPartial.hostId,
    isActive: true,
    createdAt: Date.now(),
    mode: "realtime",
    rantFirst: true,
    subHeard: roomPartial.subHeard,
    endTime: roomPartial.endTime,
    imageUrl: roomPartial.imageUrl,
    youtubeUrl: roomPartial.youtubeUrl,
    allowAnonymous: roomPartial.allowAnonymous,
  };
};