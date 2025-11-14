import {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  api,
  getUserId,
  setUserId,
  clearUserId,
} from "../utils/api";
import type {
  UserSession,
  DebateRoom,
  DebateMode,
  NewDebateRoom,
} from "../types";

export function useDebateSession() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeRooms, setActiveRooms] = useState<DebateRoom[]>(
    [],
  );
  const [currentSubHeard, setCurrentSubHeard] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user session
  const initializeUser = useCallback(
    async (
      nickname?: string,
      email?: string,
      password?: string,
      isSignIn?: boolean,
    ) => {
      try {
        setError(null);
        let userId = getUserId();
        let userData = null;

        if (userId) {
          // Try to restore existing session
          const response = await api.getUser(userId);
          if (response.success && response.data) {
            userData = response.data.user;
          }
        }

        if (!userData && email && password) {
          // Use new authentication system
          if (isSignIn) {
            // Sign in existing user
            const response = await api.signIn(email, password);
            if (response.success && response.data) {
              userData = response.data.user;
              setUserId(userData.id);
            } else {
              throw new Error(
                response.error || "Failed to sign in",
              );
            }
          } else if (nickname) {
            // Sign up new user
            const response = await api.signUp(
              nickname,
              email,
              password,
            );
            if (response.success && response.data) {
              userData = response.data.user;
              setUserId(userData.id);
            } else {
              throw new Error(
                response.error || "Failed to create account",
              );
            }
          }
        } else if (!userData && nickname && email) {
          // Fallback to old system for backwards compatibility
          const response = await api.createUser(
            nickname,
            email,
          );
          if (response.success && response.data) {
            userData = response.data.user;
            setUserId(userData.id);
          } else {
            throw new Error(
              response.error || "Failed to create user",
            );
          }
        }

        if (userData) {
          setUser(userData);
          return userData;
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to initialize user:", errorMsg);
      }
      return null;
    },
    [],
  );

  // Create room (does not join)
  const createRoom = useCallback(
    async (
      newDebate: NewDebateRoom,
      autoJoin: boolean = false,
    ): Promise<DebateRoom> => {
      if (!user) {
        throw new Error("User must be logged in to create a room");
      }

      setError(null);
      const response = await api.createRoom(newDebate, user.id);
      
      if (response.success && response.data) {
        const roomData = response.data;

        // If autoJoin, also join the room
        if (autoJoin) {
          await api.joinRoom(roomData.id, user.id);
        }

        return roomData;
      } else {
        const errorMsg = response.error || "Failed to create room";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [user],
  );

  // Join room (backend only - no local state)
  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!user) return null;

      try {
        setError(null);
        const response = await api.joinRoom(roomId, user.id);
        if (response.success && response.data) {
          return response.data.room;
        } else {
          throw new Error(
            response.error || "Failed to join room",
          );
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to join room:", errorMsg);
      }
      return null;
    },
    [user],
  );

  // Get active rooms - uses currentSubHeard from state
  const getActiveRooms = useCallback(async () => {
    try {
      const userId = user?.id;
      const response = await api.getActiveRooms(
        currentSubHeard || undefined,
        userId,
      );
      if (response.success && response.data) {
        setActiveRooms(response.data.rooms || []);
        return response.data.rooms || [];
      }
    } catch (err) {
      console.error("Failed to fetch active rooms:", err);
    }
    return [];
  }, [user?.id, currentSubHeard]);

  // Create seed data for testing
  const createSeedData = useCallback(async () => {
    if (!user) return null;

    try {
      setError(null);
      const response = await api.createSeedData(user.id);
      if (response.success && response.data) {
        // Refresh active rooms to show the new test room
        await getActiveRooms();
        return response.data;
      } else {
        throw new Error(
          response.error || "Failed to create seed data",
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("Failed to create seed data:", errorMsg);
    }
    return null;
  }, [user, getActiveRooms]);

  // Create test room with Q Street debate topic and players (no posts/votes)
  const createTestRoom = useCallback(async () => {
    if (!user) return null;

    try {
      setError(null);
      const response = await api.createTestRoom(user.id);
      if (response.success && response.data) {
        // Refresh active rooms to show the new test room
        await getActiveRooms();
        return response.data;
      } else {
        throw new Error(
          response.error || "Failed to create test room",
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("Failed to create test room:", errorMsg);
    }
    return null;
  }, [user, getActiveRooms]);

  // Create rant test room with Q Street debate topic and pre-filled rants
  const createRantTestRoom = useCallback(async () => {
    if (!user) return null;

    try {
      setError(null);
      const response = await api.createRantTestRoom(user.id);
      if (response.success && response.data) {
        // Refresh active rooms to show the new test room
        await getActiveRooms();
        return response.data;
      } else {
        throw new Error(
          response.error || "Failed to create rant test room",
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error(
        "Failed to create rant test room:",
        errorMsg,
      );
    }
    return null;
  }, [user, getActiveRooms]);

  // Create realtime test room with seed data and 5-minute timer
  const createRealtimeTestRoom = useCallback(async () => {
    if (!user) return null;

    try {
      setError(null);
      const response = await api.createRealtimeTestRoom(
        user.id,
      );
      if (response.success && response.data) {
        // Refresh active rooms to show the new test room
        await getActiveRooms();
        return response.data;
      } else {
        throw new Error(
          response.error ||
            "Failed to create realtime test room",
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error(
        "Failed to create realtime test room:",
        errorMsg,
      );
    }
    return null;
  }, [user, getActiveRooms]);

  // Mark room as inactive (dev tool)
  const setRoomInactive = useCallback(
    async (roomId: string) => {
      if (!user) return false;

      try {
        setError(null);
        const response = await api.setRoomInactive(
          roomId,
          user.id,
        );
        if (response.success) {
          // Refresh active rooms to remove the inactive room
          await getActiveRooms();
          return true;
        } else {
          throw new Error(
            response.error || "Failed to mark room as inactive",
          );
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error(
          "Failed to mark room as inactive:",
          errorMsg,
        );
      }
      return false;
    },
    [user, getActiveRooms],
  );

  // Reset session (full logout)
  const resetSession = useCallback(() => {
    setUser(null);
    setActiveRooms([]);
    setError(null);
    clearUserId();
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Try to restore user session
      await initializeUser();

      setLoading(false);
    };

    init();
  }, [initializeUser]);

  return {
    user,
    activeRooms,
    currentSubHeard,
    loading,
    error,
    initializeUser,
    createRoom,
    joinRoom,
    getActiveRooms,
    setCurrentSubHeard,
    resetSession,
    createSeedData,
    createTestRoom,
    createRantTestRoom,
    createRealtimeTestRoom,
    setRoomInactive,
  };
}