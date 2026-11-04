import type { RoomSummary } from "../types";
import type { RoomSearchOption } from "../components/RoomSearchPicker";

export function topicMatchesSearch(topic: string, search: string): boolean {
  return topic.toLowerCase().includes(search.trim().toLowerCase());
}

function formatRoomCreatedDate(createdAt: number): string {
  return new Date(createdAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toRoomSearchOption(room: RoomSummary): RoomSearchOption {
  const voteCountLabel = `${room.voteCount.toLocaleString()} votes`;
  return {
    id: room.roomId,
    topic: room.topic,
    detail: `${voteCountLabel} · ${formatRoomCreatedDate(room.createdAt)}`,
  };
}
