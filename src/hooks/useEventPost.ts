import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../utils/api";
import type { DebateRoom, Statement } from "../types";

const POST_RETRY_MS = 3000;

export interface EventPost {
  room: DebateRoom;
  statements: Statement[];
}

const fetchEventPost = async (roomId: string): Promise<EventPost | null> => {
  const response = await api.getRoomStatus(roomId);
  if (!response.success || !response.data) return null;
  return { room: response.data.room, statements: response.data.statements };
};

export function useEventPost(roomId: string | null) {
  const [post, setPost] = useState<EventPost | null>(null);
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  useEffect(() => {
    setPost(null);
    if (!roomId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      const loaded = await fetchEventPost(roomId);
      if (cancelled) return;
      if (loaded) setPost(loaded);
      else timer = setTimeout(load, POST_RETRY_MS);
    };

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [roomId]);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const loaded = await fetchEventPost(roomId);
    if (loaded && roomIdRef.current === roomId) setPost(loaded);
  }, [roomId]);

  const addStatement = useCallback((statement: Statement) => {
    setPost((current) =>
      current && current.room.id === statement.roomId
        ? { ...current, statements: [...current.statements, statement] }
        : current,
    );
  }, []);

  return { post, refresh, addStatement };
}
