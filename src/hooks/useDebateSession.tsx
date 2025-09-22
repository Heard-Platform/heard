import { useState, useEffect, useCallback } from "react";
import {
  api,
  getUserId,
  setUserId,
  getRoomId,
  setRoomId,
  clearRoomId,
} from "../utils/api";

interface UserSession {
  id: string;
  nickname: string;
  score: number;
  bridgePoints: number;
  cruxPoints: number;
  pluralityPoints: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
}

type Phase =
  | "lobby"
  | "initial"
  | "bridge"
  | "crux"
  | "plurality"
  | "results";
type SubPhase = "posting" | "voting" | "review";

interface DebateRoom {
  id: string;
  topic: string;
  phase: Phase;
  subPhase?: SubPhase;
  roundNumber: number;
  phaseStartTime: number;
  participants: string[];
  isActive: boolean;
  createdAt: number;
}

interface Statement {
  id: string;
  text: string;
  author: string;
  votes: number;
  type?: "bridge" | "crux" | "plurality";
  isSpicy?: boolean;
  roomId: string;
  timestamp: number;
  voters: { [userId: string]: "up" | "down" };
}

interface Achievement {
  title: string;
  description: string;
  points: number;
  type: "score" | "bridge" | "crux" | "plurality" | "streak";
}

export function useDebateSession() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [room, setRoom] = useState<DebateRoom | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [activeRooms, setActiveRooms] = useState<DebateRoom[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAchievement, setLastAchievement] =
    useState<Achievement | null>(null);

  // Initialize user session
  const initializeUser = useCallback(
    async (nickname?: string) => {
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

        if (!userData && nickname) {
          // Create new user session
          const response = await api.createUser(nickname);
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

  // Create or join room
  const createRoom = useCallback(
    async (topic: string) => {
      if (!user) return null;

      try {
        setError(null);
        const response = await api.createRoom(topic, user.id);
        if (response.success && response.data) {
          const roomData = response.data.room;
          setRoom(roomData);
          setRoomId(roomData.id);
          return roomData;
        } else {
          throw new Error(
            response.error || "Failed to create room",
          );
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to create room:", errorMsg);
      }
      return null;
    },
    [user],
  );

  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!user) return null;

      try {
        setError(null);
        const response = await api.joinRoom(roomId, user.id);
        if (response.success && response.data) {
          const roomData = response.data.room;
          setRoom(roomData);
          setRoomId(roomData.id);
          return roomData;
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

  // Refresh room status and statements
  const refreshRoom = useCallback(async () => {
    if (!room) return;

    try {
      const response = await api.getRoomStatus(room.id);
      if (response.success && response.data) {
        setRoom(response.data.room);
        setStatements(response.data.statements || []);
      }
    } catch (err) {
      console.error("Failed to refresh room:", err);
    }
  }, [room]);

  // Submit statement
  const submitStatement = useCallback(
    async (
      text: string,
      type?: "bridge" | "crux" | "plurality",
    ) => {
      if (!user || !room) return false;

      try {
        setError(null);
        const response = await api.submitStatement(
          room.id,
          text,
          type,
          user.id,
        );
        if (response.success && response.data) {
          // Update user points
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  score:
                    prev.score + response.data.pointsEarned,
                  bridgePoints:
                    type === "bridge"
                      ? prev.bridgePoints +
                        response.data.pointsEarned
                      : prev.bridgePoints,
                  cruxPoints:
                    type === "crux"
                      ? prev.cruxPoints +
                        response.data.pointsEarned
                      : prev.cruxPoints,
                  pluralityPoints:
                    type === "plurality"
                      ? prev.pluralityPoints +
                        response.data.pointsEarned
                      : prev.pluralityPoints,
                  streak: prev.streak + 1,
                }
              : prev,
          );

          // Show achievement
          if (response.data.achievement) {
            setLastAchievement(response.data.achievement);
            setTimeout(() => setLastAchievement(null), 4000);
          }

          // Refresh room to get updated statements
          await refreshRoom();
          return true;
        } else {
          throw new Error(
            response.error || "Failed to submit statement",
          );
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to submit statement:", errorMsg);
      }
      return false;
    },
    [user, room, refreshRoom],
  );

  // Vote on statement
  const voteOnStatement = useCallback(
    async (statementId: string, voteType: "up" | "down") => {
      if (!user) return false;

      try {
        setError(null);
        console.log(
          "Voting on statement:",
          statementId,
          voteType,
        );
        const response = await api.voteOnStatement(
          statementId,
          voteType,
          user.id,
        );
        console.log("Vote response:", response);

        if (response.success && response.data) {
          // Update user points if voting up
          if (response.data.pointsEarned > 0) {
            setUser((prev) =>
              prev
                ? {
                    ...prev,
                    score:
                      prev.score + response.data.pointsEarned,
                  }
                : prev,
            );
          }

          // Update statement in local state
          setStatements((prev) =>
            prev.map((stmt) =>
              stmt.id === statementId
                ? { ...stmt, ...response.data.statement }
                : stmt,
            ),
          );

          return true;
        } else {
          throw new Error(response.error || "Failed to vote");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to vote:", errorMsg);
      }
      return false;
    },
    [user],
  );

  // Update room phase
  const updateRoomPhase = useCallback(
    async (phase: Phase, subPhase?: SubPhase) => {
      if (!user || !room) return false;

      try {
        setError(null);
        const response = await api.updateRoomPhase(
          room.id,
          phase,
          user.id,
          subPhase,
        );
        if (response.success && response.data) {
          setRoom(response.data.room);
          return true;
        } else {
          throw new Error(
            response.error || "Failed to update phase",
          );
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to update phase:", errorMsg);
      }
      return false;
    },
    [user, room],
  );

  // Get active rooms
  const getActiveRooms = useCallback(async () => {
    try {
      const response = await api.getActiveRooms();
      if (response.success && response.data) {
        setActiveRooms(response.data.rooms || []);
        return response.data.rooms || [];
      }
    } catch (err) {
      console.error("Failed to fetch active rooms:", err);
    }
    return [];
  }, []);

  // Leave current room but keep user logged in
  const leaveRoom = useCallback(() => {
    setRoom(null);
    setStatements([]);
    setLastAchievement(null);
    clearRoomId();
  }, []);

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

  // Reset session (full logout)
  const resetSession = useCallback(() => {
    setUser(null);
    setRoom(null);
    setStatements([]);
    setActiveRooms([]);
    setError(null);
    setLastAchievement(null);
    clearRoomId();
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Try to restore user session
      await initializeUser();

      // Try to restore room if we have a room ID
      const savedRoomId = getRoomId();
      if (savedRoomId) {
        const response = await api.getRoomStatus(savedRoomId);
        if (response.success && response.data) {
          setRoom(response.data.room);
          setStatements(response.data.statements || []);
        } else {
          clearRoomId();
        }
      }

      setLoading(false);
    };

    init();
  }, [initializeUser]);

  // Polling for real-time updates
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      refreshRoom();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [room, refreshRoom]);

  return {
    user,
    room,
    statements,
    activeRooms,
    loading,
    error,
    lastAchievement,
    initializeUser,
    createRoom,
    joinRoom,
    getActiveRooms,
    submitStatement,
    voteOnStatement,
    updateRoomPhase,
    refreshRoom,
    leaveRoom,
    resetSession,
    createSeedData,
  };
}