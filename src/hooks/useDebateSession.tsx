import { useState, useEffect, useCallback, useRef } from "react";
import {
  api,
  getUserId,
  setUserId,
  getRoomId,
  setRoomId,
  clearRoomId,
} from "../utils/api";
import type {
  UserSession,
  Phase,
  SubPhase,
  DebateRoom,
  Statement,
  Achievement,
  DebateMode,
  Rant,
} from "../types";

export function useDebateSession() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [room, setRoom] = useState<DebateRoom | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [rants, setRants] = useState<Rant[]>([]);
  const [activeRooms, setActiveRooms] = useState<DebateRoom[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAchievement, setLastAchievement] =
    useState<Achievement | null>(null);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoPlayCounts, setAutoPlayCounts] = useState<{
    posts: { [playerId: string]: number };
    votes: { [playerId: string]: number };
  }>({ posts: {}, votes: {} });
  const autoPlayActiveRef = useRef(false);

  // Initialize user session
  const initializeUser = useCallback(
    async (nickname?: string, email?: string) => {
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

        if (!userData && nickname && email) {
          // Create new user session
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

  // Create or join room
  const createRoom = useCallback(
    async (
      topic: string,
      mode: DebateMode = "host-controlled",
      rantFirst?: boolean,
      description?: string,
    ) => {
      if (!user) return null;

      try {
        setError(null);
        const response = await api.createRoom(
          topic,
          user.id,
          mode,
          rantFirst,
          description,
        );
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
        setRants(response.data.rants || []);
      } else {
        console.error("Room refresh failed:", response.error);
        setError(response.error || "Failed to refresh room");
      }
    } catch (err) {
      console.error("Failed to refresh room:", err);
      setError(
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  }, [room]);

  // Submit statement
  const submitStatement = useCallback(
    async (text: string) => {
      if (!user || !room) return false;

      try {
        setError(null);
        const response = await api.submitStatement(
          room.id,
          text,
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
    async (
      statementId: string,
      voteType: "agree" | "disagree" | "pass",
    ) => {
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
          // Update user points if agreeing
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

          // Update statement in local state with the full response data
          setStatements((prev) =>
            prev.map((stmt) =>
              stmt.id === statementId
                ? { 
                    ...stmt, 
                    ...response.data.statement,
                  }
                : stmt,
            )
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

  // Submit rant
  const submitRant = useCallback(
    async (text: string) => {
      if (!user || !room) return false;

      try {
        setError(null);
        const response = await api.submitRant(
          room.id,
          text,
          user.id,
        );
        if (response.success && response.data) {
          // Refresh room to get updated rants
          await refreshRoom();
          return true;
        } else {
          throw new Error(
            response.error || "Failed to submit rant",
          );
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to submit rant:", errorMsg);
      }
      return false;
    },
    [user, room, refreshRoom],
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

  // Update room description
  const updateRoomDescription = useCallback(
    async (description: string) => {
      if (!user || !room) return false;

      try {
        setError(null);
        const response = await api.updateRoomDescription(
          room.id,
          description,
          user.id,
        );
        if (response.success && response.data) {
          setRoom(response.data.room);
          return true;
        } else {
          throw new Error(
            response.error || "Failed to update description",
          );
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to update description:", errorMsg);
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

  // Auto-play cleanup function - defined early to avoid dependency issues
  const stopAutoPlay = useCallback(() => {
    setAutoPlayActive(false);
    autoPlayActiveRef.current = false;
    if (autoPlayInterval) {
      clearTimeout(autoPlayInterval);
      setAutoPlayInterval(null);
    }
  }, [autoPlayInterval]);

  // Leave current room but keep user logged in
  const leaveRoom = useCallback(() => {
    stopAutoPlay(); // Stop auto-play when leaving room
    setRoom(null);
    setStatements([]);
    setLastAchievement(null);
    clearRoomId();
  }, [stopAutoPlay]);

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
      console.error("Failed to create rant test room:", errorMsg);
    }
    return null;
  }, [user, getActiveRooms]);

  // Auto-play statements for testing
  const qStreetDebateStatements = [
    "Closing Q Street during farmers market creates a vibrant community space that brings neighbors together",
    "Traffic diversions hurt local businesses on surrounding streets - we need better solutions", 
    "The farmers market is a weekly tradition that deserves priority over car convenience",
    "Emergency vehicles can't access residents quickly when Q Street is blocked",
    "Local vendors and artisans benefit enormously from the foot traffic when cars are gone",
    "Elderly residents struggle with longer walking distances when forced to park blocks away",
    "Air quality improves significantly when we prioritize pedestrians over vehicles",
    "The current system discriminates against people who work weekends and need car access",
    "Kids can safely play and families can enjoy the space without worrying about traffic",
    "Small businesses along Q Street lose customers who can't easily drive and park",
    "This is about creating a more livable neighborhood that values people over cars",
    "The parking restrictions place an unfair burden on residents who live on Q Street"
  ];

  const getRandomStatement = () => {
    return qStreetDebateStatements[Math.floor(Math.random() * qStreetDebateStatements.length)];
  };

  const getRandomDelay = () => Math.floor(Math.random() * 5000) + 5000; // 5-10 seconds

  const simulatePlayerActivity = useCallback(async () => {
    if (!room || !user) return;

    const participants = room.participants.filter(p => p !== user.id);
    if (participants.length === 0) return;

    // Don't simulate activity during review phase - no user interaction needed
    if (room.subPhase === "review") return;

    if (room.subPhase === "posting") {
      // Find players who haven't reached the post limit
      const availablePlayers = participants.filter(
        playerId => (autoPlayCounts.posts[playerId] || 0) < 4
      );
      
      if (availablePlayers.length > 0) {
        const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
        const statement = getRandomStatement();
        
        try {
          const response = await api.submitStatement(room.id, statement, randomPlayer);
          if (response.success) {
            setAutoPlayCounts(prev => ({
              ...prev,
              posts: {
                ...prev.posts,
                [randomPlayer]: (prev.posts[randomPlayer] || 0) + 1
              }
            }));
            await refreshRoom();
          }
        } catch (err) {
          console.error("Auto-play post failed:", err);
        }
      }
    } else if (room.subPhase === "voting") {
      // Find players who haven't reached the vote limit and statements to vote on
      const availablePlayers = participants.filter(
        playerId => (autoPlayCounts.votes[playerId] || 0) < 4
      );
      
      if (availablePlayers.length > 0 && statements.length > 0) {
        const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
        
        // Find statements this player hasn't voted on yet
        const unvotedStatements = statements.filter(
          stmt => !stmt.voters[randomPlayer] && stmt.author !== randomPlayer
        );
        
        if (unvotedStatements.length > 0) {
          const randomStatement = unvotedStatements[Math.floor(Math.random() * unvotedStatements.length)];
          const voteTypes: ("agree" | "disagree" | "pass")[] = ["agree", "disagree", "pass"];
          const randomVote = voteTypes[Math.floor(Math.random() * voteTypes.length)];
          
          try {
            const response = await api.voteOnStatement(randomStatement.id, randomVote, randomPlayer);
            if (response.success) {
              setAutoPlayCounts(prev => ({
                ...prev,
                votes: {
                  ...prev.votes,
                  [randomPlayer]: (prev.votes[randomPlayer] || 0) + 1
                }
              }));
              // Update local statement state
              setStatements(prev =>
                prev.map(stmt =>
                  stmt.id === randomStatement.id
                    ? { ...stmt, ...response.data.statement }
                    : stmt
                )
              );
            }
          } catch (err) {
            console.error("Auto-play vote failed:", err);
          }
        }
      }
    }
  }, [room, user, statements, autoPlayCounts, refreshRoom]);

  const startAutoPlay = useCallback(() => {
    if (!room || autoPlayActiveRef.current) return;

    // Only start auto-play if we're in a phase that needs activity
    if (room.subPhase !== "posting" && room.subPhase !== "voting") return;

    setAutoPlayActive(true);
    autoPlayActiveRef.current = true;
    setAutoPlayCounts({ posts: {}, votes: {} }); // Reset counts

    // Schedule the first activity
    const scheduleActivity = () => {
      // Check if auto-play is still active before scheduling
      if (!autoPlayActiveRef.current) return;
      
      const delay = getRandomDelay();
      console.log(`Scheduling next auto-play activity in ${delay}ms`);
      
      const timeoutId = setTimeout(async () => {
        // Double-check if auto-play is still active
        if (!autoPlayActiveRef.current) return;
        
        try {
          await simulatePlayerActivity();
        } catch (error) {
          console.error("Auto-play activity failed:", error);
        }
        
        // Schedule next activity if auto-play is still active
        scheduleActivity();
      }, delay);
      
      setAutoPlayInterval(timeoutId);
    };

    scheduleActivity();
  }, [room, simulatePlayerActivity]);

  // Clean up auto-play when room changes or component unmounts
  useEffect(() => {
    return () => {
      if (autoPlayInterval) {
        clearTimeout(autoPlayInterval);
      }
    };
  }, [autoPlayInterval]);

  // Stop auto-play when room is gone
  useEffect(() => {
    if (!room && autoPlayActive) {
      stopAutoPlay();
    }
  }, [room, autoPlayActive, stopAutoPlay]);

  // Sync ref with state
  useEffect(() => {
    autoPlayActiveRef.current = autoPlayActive;
  }, [autoPlayActive]);

  // Stop auto-play when phase changes to review or results
  useEffect(() => {
    if (autoPlayActive && room) {
      // Stop auto-play during review phase or results
      if (room.subPhase === "review" || room.phase === "results") {
        stopAutoPlay();
      }
    }
  }, [room?.subPhase, room?.phase, autoPlayActive, stopAutoPlay]);

  // Reset session (full logout)
  const resetSession = useCallback(() => {
    stopAutoPlay(); // Stop auto-play on logout
    setUser(null);
    setRoom(null);
    setStatements([]);
    setActiveRooms([]);
    setError(null);
    setLastAchievement(null);
    clearRoomId();
  }, [stopAutoPlay]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Try to restore user session
      await initializeUser();

      // Try to restore room if we have a room ID
      const savedRoomId = getRoomId();
      if (savedRoomId) {
        console.log(`Restoring room: ${savedRoomId}`);
        const response = await api.getRoomStatus(savedRoomId);
        console.log("Room restore response:", response);
        if (response.success && response.data) {
          setRoom(response.data.room);
          setStatements(response.data.statements || []);
        } else {
          console.log("Room restore failed, clearing room ID");
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
    rants,
    activeRooms,
    loading,
    error,
    lastAchievement,
    autoPlayActive,
    initializeUser,
    createRoom,
    joinRoom,
    getActiveRooms,
    submitStatement,
    submitRant,
    voteOnStatement,
    updateRoomPhase,
    updateRoomDescription,
    refreshRoom,
    leaveRoom,
    resetSession,
    createSeedData,
    createTestRoom,
    createRantTestRoom,
    startAutoPlay,
    stopAutoPlay,
  };
}