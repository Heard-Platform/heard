import type { ReviewRoomOption } from "../types";
import type { RoomSearchOption } from "../components/RoomSearchPicker";

export function topicMatchesSearch(topic: string, search: string): boolean {
  return topic.toLowerCase().includes(search.trim().toLowerCase());
}

export function toRoomSearchOption(room: ReviewRoomOption): RoomSearchOption {
  return { id: room.roomId, topic: room.topic, detail: `${room.voteCount.toLocaleString()} votes` };
}
