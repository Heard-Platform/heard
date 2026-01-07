import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import {
  api,
  getUserId,
  setUserId,
  clearUserId,
} from "../utils/api";
import type {
  UserSession,
  DebateRoom,
  NewDebateRoom,
  Statement,
  VoteType,
  AnalysisData,
} from "../types";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "../utils/constants/errors";
import { FlyerVoteResponse } from "../types/api-responses";

interface DebateSessionContextType {
  user: UserSession | null;
  activeRooms: DebateRoom[];
  currentSubHeard: string | null;
  loading: boolean;
  error: string | null;
  initializeUser: (
    nickname?: string,
    email?: string,
    password?: string,
    isSignIn?: boolean,
    providedUser?: UserSession,
  ) => Promise<UserSession | null>;
  createRoom: (
    newDebate: NewDebateRoom,
    autoJoin?: boolean,
  ) => Promise<DebateRoom>;
  joinRoom: (roomId: string) => Promise<any>;
  submitStatement: (roomId: string, text: string) => Promise<any>;
  voteOnStatement: (
    statementId: string,
    voteType: VoteType,
  ) => Promise<any>;
  voteViaFlyer: (
    flyerId: string,
    statementId: string,
    vote: VoteType,
    userId?: string,
  ) => Promise<FlyerVoteResponse>;
  markChanceCardSwiped: (
    userId: string,
    roomId: string,
  ) => Promise<void>;
  getActiveRooms: () => Promise<DebateRoom[]>;
  setCurrentSubHeard: (subHeard: string | null) => void;
  resetSession: () => void;
  createSeedData: () => Promise<any>;
  createTestRoom: () => Promise<any>;
  createRantTestRoom: () => Promise<any>;
  createRealtimeTestRoom: () => Promise<any>;
  setRoomInactive: (roomId: string) => Promise<boolean>;
  roomStatements: Record<string, Statement[]>;
  getRoomStatements: (roomId: string) => Promise<Statement[]>;
  getAllRoomStatements: () => Promise<Record<string, Statement[]>>;
  getRoomAnalysis: (roomId: string) => Promise<AnalysisData | null>;
}

const DebateSessionContext = createContext<DebateSessionContextType | null>(null);

export function DebateSessionProvider({ children, showcase }: { children: ReactNode; showcase?: boolean }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeRooms, setActiveRooms] = useState<DebateRoom[]>(
    [],
  );
  const [currentSubHeard, setCurrentSubHeard] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomStatements, setRoomStatements] = useState<
    Record<string, Statement[]>
  >({});

  // Initialize user session
  const initializeUser = useCallback(
    async (
      nickname?: string,
      email?: string,
      password?: string,
      isSignIn?: boolean,
      providedUser?: UserSession,
    ) => {
      try {
        setError(null);
        let userId = getUserId();
        let user = providedUser || null;

        if (!user && userId) {
          const response = await api.getUser(userId);
          if (response.success && response.data) {
            user = response.data.user;
          }
        }

        if (!user && email && password) {
          // Use new authentication system
          if (isSignIn) {
            // Sign in existing user
            const response = await api.signIn(email, password) as any;
            if (response.success && response.data) {
              user = response.data.user;
              setUserId(user.id);
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
            ) as any;
            if (response.success && response.data) {
              user = response.data.user;
              setUserId(user.id);
            } else {
              throw new Error(
                response.error || "Failed to create account",
              );
            }
          }
        } else if (!user && nickname && email) {
          // Fallback to old system for backwards compatibility
          const response = await api.createUser(
            nickname,
            email,
          ) as any;
          if (response.success && response.data) {
            user = response.data.user;
            setUserId(user.id);
          } else {
            throw new Error(
              response.error || "Failed to create user",
            );
          }
        }

        if (user) {
          setUser(user);

          // Track user activity
          api.trackActivity(user.id).catch((err) => {
            console.error("Failed to track activity:", err);
            // Don't block user flow if tracking fails
          });

          return user;
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

  // Update user score from API response
  const updateUserScoreFromResponse = useCallback(
    (responseData: any) => {
      if (
        responseData &&
        responseData.userScore !== undefined
      ) {
        setUser((prev) =>
          prev
            ? { ...prev, score: responseData.userScore }
            : prev,
        );
      }
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
        throw new Error(
          "User must be logged in to create a room",
        );
      }

      setError(null);
      const response = await api.createRoom(newDebate, user.id);

      if (response.success && response.data) {
        const roomData = response.data;

        updateUserScoreFromResponse(roomData);

        if (autoJoin) {
          await api.joinRoom(roomData.id, user.id);
        }

        return roomData;
      } else {
        const errorMsg =
          response.error || "Failed to create room";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [user, updateUserScoreFromResponse],
  );

  // Join room (backend only - no local state)
  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!user) return null;

      try {
        setError(null);
        const response = await api.joinRoom(roomId, user.id) as any;
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

  // Submit statement
  const submitStatement = useCallback(
    async (roomId: string, text: string) => {
      if (!user) {
        throw new Error(
          "User must be logged in to submit a statement",
        );
      }

      setError(null);
      const response = await api.submitStatement(
        roomId,
        text,
        user.id,
      );

      if (response.success && response.data) {
        updateUserScoreFromResponse(response.data);
        return response.data;
      } else {
        const errorMsg =
          response.error || "Failed to submit statement";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [user, updateUserScoreFromResponse],
  );

  // Vote on statement
  const voteOnStatement = useCallback(
    async (
      statementId: string,
      voteType: "agree" | "disagree" | "pass" | "super_agree",
    ) => {
      if (!user) {
        throw new Error("User must be logged in to vote");
      }

      setError(null);
      const response = await api.voteOnStatement(
        statementId,
        voteType,
        user.id,
      );

      if (response.success && response.data) {
        updateUserScoreFromResponse(response.data);
        return response.data;
      } else {
        const errorMsg =
          response.error || "Failed to vote on statement";
        if (errorMsg !== ANONYMOUS_ACTION_NOT_ALLOWED_ERROR) {
          setError(errorMsg);
        }
        throw new Error(errorMsg);
      }
    },
    [user, updateUserScoreFromResponse],
  );

  const voteViaFlyer = useCallback(
    async (
      flyerId: string,
      statementId: string,
      vote: VoteType,
      userId?: string,
    ) => {
      setError(null);
      try {
        const response = await api.voteViaFlyer(
          flyerId,
          statementId,
          vote,
          userId,
        );

        if (response.success && response.data) {
          return response.data;
        } else {
          const errorMsg =
            response.error || "Failed to vote via flyer";
          setError(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to vote via flyer:", errorMsg);
        throw err;
      }
    },
    [user],
  );

  const markChanceCardSwiped = useCallback(
    async (userId: string, roomId: string) => {
      try {
        const response = await api.markChanceCardSwiped(userId, roomId);
        if (!response.success) {
          throw new Error(response.error || "Failed to mark chance card as swiped");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to mark chance card as swiped:", errorMsg);
      }
    }, [],
  );

  // Get active rooms - uses currentSubHeard from state
  const getActiveRooms = useCallback(async () => {
    try {
      const userId = user?.id;
      const response = await api.getActiveRooms(
        currentSubHeard || undefined,
        userId,
      ) as any;
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

  // Fetch statements for a specific room
  const getRoomStatements = useCallback(
    async (roomId: string) => {
      try {
        const response = await api.getRoomStatus(roomId) as any;
        if (response.success && response.data) {
          const statements = response.data.statements || [];
          setRoomStatements((prev) => ({
            ...prev,
            [roomId]: statements,
          }));
          return statements;
        }
      } catch (error) {
        console.error(
          `Error fetching statements for room ${roomId}:`,
          error,
        );
      }
      return [];
    },
    [],
  );

  const getRoomAnalysis = useCallback(async (roomId: string) => {
    try {
      const response = (await api.getRoomAnalysis(roomId)) as any;
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error(
        `Error fetching analysis for room ${roomId}:`,
        error,
      );
    }
    return null;
  }, []);

  // Fetch statements for multiple rooms
  const getAllRoomStatements = useCallback(async () => {
    const statementsMap: Record<string, Statement[]> = {};

    for (const room of activeRooms) {
      try {
        const response = await api.getRoomStatus(room.id) as any;
        if (response.success && response.data) {
          statementsMap[room.id] =
            response.data.statements || [];
        }
      } catch (error) {
        console.error(
          `Error fetching statements for room ${room.id}:`,
          error,
        );
        statementsMap[room.id] = [];
      }
    }

    setRoomStatements(statementsMap);
    return statementsMap;
  }, [activeRooms]);

  // Reset session (full logout)
  const resetSession = useCallback(() => {
    setUser(null);
    setActiveRooms([]);
    setRoomStatements({});
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

  let returnObj = {
    user,
    activeRooms,
    currentSubHeard,
    loading,
    error,
    initializeUser,
    createRoom,
    joinRoom,
    submitStatement,
    voteOnStatement,
    voteViaFlyer,
    getActiveRooms,
    setCurrentSubHeard,
    resetSession,
    createSeedData,
    createTestRoom,
    createRantTestRoom,
    createRealtimeTestRoom,
    setRoomInactive,
    roomStatements,
    getRoomStatements,
    getAllRoomStatements,
    getRoomAnalysis,
    markChanceCardSwiped,
  };

  if (showcase) {
    returnObj = {
      ...returnObj,
      setRoomInactive: async () => { 
        console.log("[Showcase] setRoomInactive called"); 
        return true; 
      },
      getRoomStatements: async () => { 
        console.log("[Showcase] getRoomStatements called"); 
        return [];
      },
      getRoomAnalysis: async () => { 
        console.log("[Showcase] getRoomAnalysis called"); 
        return null;
      },
      createSeedData: async () => {
        console.log("[Showcase] createSeedData called");
        return { success: true };
      },
      createTestRoom: async () => {
        console.log("[Showcase] createTestRoom called");
        return { success: true };
      },
      createRantTestRoom: async () => {
        console.log("[Showcase] createRantTestRoom called");
        return { success: true };
      },
      createRealtimeTestRoom: async () => {
        console.log("[Showcase] createRealtimeTestRoom called");
        return { success: true };
      },
      markChanceCardSwiped: async (userId: string, roomId: string) => {
        console.log("[Showcase] markChanceCardSwiped called");
      },
    };
  }

  return (
    <DebateSessionContext.Provider value={returnObj}>
      {children}
    </DebateSessionContext.Provider>
  );
}

export function useDebateSession() {
  const context = useContext(DebateSessionContext);
  if (!context) {
    throw new Error("useDebateSession must be used within a DebateSessionProvider");
  }
  return context;
}