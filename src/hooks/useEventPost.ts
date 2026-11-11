import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../utils/api";
import type { EventPost, Statement } from "../types";

const POST_RETRY_MS = 3000;

const fetchEventPost = async (
  roomId: string,
): Promise<EventPost | null> => {
  const response = await api.getEventPost(roomId);
  if (!response.success || !response.data) return null;
  return response.data.post;
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

  const refresh = useCallback(async (): Promise<boolean> => {
    if (!roomId) return false;
    const loaded = await fetchEventPost(roomId);
    if (!loaded) return false;
    if (roomIdRef.current === roomId) setPost(loaded);
    return true;
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
