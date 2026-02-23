import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import {
  api,
  getUserId,
  setUserId,
  clearUserId,
  getSessionId,
  setSessionId,
  clearSessionId,
} from "../utils/api";
import type {
  UserSession,
  DebateRoom,
  NewDebateRoom,
  Statement,
  VoteType,
  AnalysisData,
  SubHeard,
  EnrichmentConfig,
} from "../types";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "../utils/constants/errors";
import { FlyerVoteResponse, UserSessionResponse } from "../types/api-responses";
import { ApiResponse } from "../utils/api-client";

interface DebateSessionContextType {
  user: UserSession | null;
  activeRooms: DebateRoom[];
  currentSubHeard: string | null;
  loading: boolean;
  error: string | null;
  sendMagicLink: (email: string) => Promise<ApiResponse | null>;
  verifyMagicLink: (code: string) => Promise<ApiResponse<UserSessionResponse> | null>;
  sendSmsCode: (phone: string, requireExisting?: boolean) => Promise<ApiResponse | null>;
  verifySmsCode: (phone: string, code: string) => Promise<ApiResponse<UserSessionResponse> | null>;
  addPhoneToAccount: (userId: string, phone: string, code: string) => Promise<ApiResponse<{ user: UserSession }> | null>;
  addEmailToAccount: (email: string) => Promise<ApiResponse<{ user: UserSession }> | null>;
  createAnonymousUser: () => Promise<ApiResponse<UserSessionResponse> | null>;
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
  flagStatement: (
    statementId: string,
    roomId: string,
  ) => Promise<void>;
  voteViaFlyer: (
    flyerId: string,
    statementId: string,
    vote: VoteType,
    userId?: string,
  ) => Promise<FlyerVoteResponse | null>;
  submitFlyerEmail: (email: string) => Promise<ApiResponse | null>;
  markChanceCardSwiped: (
    userId: string,
    roomId: string,
  ) => Promise<void>;
  markYouTubeCardSwiped: (
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
  getRoomAnalysis: (roomId: string) => Promise<AnalysisData | null>;
  getSubHeards: (userId: string) => Promise<ApiResponse<{ subHeards: SubHeard[] }> | null>;
  getExplorableSubHeards: (userId: string) => Promise<ApiResponse<SubHeard[]> | null>;
  joinSubHeard: (subHeardName: string, userId: string) => Promise<ApiResponse<undefined> | null>;
  leaveSubHeard: (subHeardName: string, userId: string) => Promise<ApiResponse<undefined> | null>;
  getEnrichmentConfig: () => Promise<ApiResponse<EnrichmentConfig> | null>;
  setEnrichmentConfig: (
    config: EnrichmentConfig,
  ) => Promise<ApiResponse<EnrichmentConfig> | null>;
  runEnrichmentNow: () => Promise<ApiResponse<{
    roomId: string;
    statementIds: string[];
  }> | null>;
}

export type OverridableApiMethods = Pick<DebateSessionContextType, "getExplorableSubHeards">;

const DebateSessionContext = createContext<DebateSessionContextType | null>(null);

export function DebateSessionProvider(
  { children, showcase, showcaseOverrides }:
  { children: ReactNode; showcase?: boolean, showcaseOverrides?: Partial<OverridableApiMethods> }
) {
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

  const loadUserUsingStoredId = useCallback(async (userId: string) => {
    try {
      setError(null);
      const response = await api.getUser(userId);
      if (response.success && response.data) {
        const user = response.data.user;
        setUser(user);
        return user;
      } else if (response.error === "SESSION_EXPIRED") {
        console.log("Session expired, clearing local data");
        clearUserId();
        clearSessionId();
        return null;
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("Failed to load user from storage:", errorMsg);
    }
    return null;
  }, []);

  const initializeSessionForLegacyUser = useCallback(async (userId: string) => {
    try {
      setError(null);
      console.log("Initializing session for legacy user:", userId);
      const migrationResponse = await api.migrateSession(userId);
      if (migrationResponse.success && migrationResponse.data) {
        setSessionId(migrationResponse.data.sessionId);
        console.log("Session initialization successful");
      } else if (migrationResponse.error === "SESSION_EXPIRED") {
        console.log("Session expired during migration, clearing local data");
        clearUserId();
        clearSessionId();
        return null;
      } else {
        throw new Error(
          migrationResponse.error || "Failed to initialize session for legacy user",
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("Failed to initialize session for legacy user:", errorMsg);
    }
    return null;
  }, []);

  const setUserAndSession = useCallback((providedUser: UserSession, sessionId: string) => {
    try {
      setError(null);
      setUser(providedUser);
      setUserId(providedUser.id);
      setSessionId(sessionId);
      api.trackActivity(providedUser.id).catch((err) => {
        console.error("Failed to track activity:", err);
      });
      
      return providedUser;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("Failed to set user session:", errorMsg);
    }
    return null;
  }, []);

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

  const safelyMakeApiCall = useCallback(
    async <T,>(callFn: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T> | null> => {
      setError(null);
      try {
        const response = await callFn();
        if (response.success) {
          return response;
        } else {
          throw new Error(response.error || "Unknown error");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("API call failed:", errorMsg);
        return null;
      }
    },
    [],
  );

  const sendMagicLink = useCallback(async (email: string) => {
    return safelyMakeApiCall<undefined>(() => api.sendMagicLink(email));
  }, [safelyMakeApiCall]);

  const verifyMagicLink = useCallback(async (code: string) => {
    const response = await safelyMakeApiCall<UserSessionResponse>(() => api.verifyMagicLink(code));
    if (response && response.success && response.data) {
      setUserAndSession(response.data.user, response.data.sessionId);
    }
    return response;
  }, [safelyMakeApiCall, setUserAndSession]);

  const sendSmsCode = useCallback(async (phone: string, requireExisting?: boolean) => {
    return safelyMakeApiCall<undefined>(() => api.sendSmsCode(phone, requireExisting));
  }, [safelyMakeApiCall]);

  const verifySmsCode = useCallback(async (phone: string, code: string) => {
    const response = await safelyMakeApiCall<UserSessionResponse>(() => api.verifySmsCode(phone, code));
    if (response && response.success && response.data) {
      setUserAndSession(response.data.user, response.data.sessionId);
    }
    return response;
  }, [safelyMakeApiCall, setUserAndSession]);

  const addPhoneToAccount = useCallback(async (userId: string, phone: string, code: string) => {
    const response = await safelyMakeApiCall<{ user: UserSession }>(() => api.addPhoneToAccount(userId, phone, code));
    if (response?.data?.user) {
      setUser(response.data.user);
    }
    return response;
  }, [safelyMakeApiCall]);

  const addEmailToAccount = useCallback(async (email: string) => {
    const response = await safelyMakeApiCall<{ user: UserSession }>(() => api.addEmailToAccount(user!.id, email));
    if (response?.data?.user) {
      setUser(response.data.user);
    }
    return response;
  }, [safelyMakeApiCall, user?.id]);

  const createAnonymousUser = useCallback(async () => {
    const response = await safelyMakeApiCall<UserSessionResponse>(() => api.createAnonymousUser());
    if (response && response.success && response.data) {
      setUserAndSession(response.data.user, response.data.sessionId);
    }
    return response;
  }, [safelyMakeApiCall, setUserAndSession]);

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
        
        const updatedStatement = response.data.statement;
        setRoomStatements((prev) => {
          const roomId = updatedStatement.roomId;
          return {
            ...prev,
            [roomId]: prev[roomId].map((stmt) =>
              stmt.id === updatedStatement.id
                ? updatedStatement
                : stmt,
            ),
          };
        });
        
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

  const flagStatement = useCallback(
    async (statementId: string, roomId: string) => {
      try {
        const response = await api.flagStatement(statementId, roomId);
        if (!response.success) {
          throw new Error(response.error || "Failed to flag statement");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to flag statement:", errorMsg);
      }
    }, [],
  );

  const voteViaFlyer = useCallback(
    async (
      flyerId: string,
      statementId: string,
      vote: VoteType,
      userId?: string,
    ) => {
      const response = await safelyMakeApiCall<FlyerVoteResponse>(() =>
        api.voteViaFlyer(flyerId, statementId, vote, userId),
      );
      if (response && response.success && response.data) {
        setUserAndSession(
          response.data.user,
          response.data.sessionId,
        );
      }
      return response?.data ? response.data : null;
    },
    [safelyMakeApiCall, setUserAndSession],
  );

  const submitFlyerEmail = useCallback(
    async (email: string) => {
      return safelyMakeApiCall(() =>
        api.submitFlyerEmail(email),
      );
    },
    [safelyMakeApiCall],
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

  const markYouTubeCardSwiped = useCallback(
    async (userId: string, roomId: string) => {
      try {
        const response = await api.markYouTubeCardSwiped(userId, roomId);
        if (!response.success) {
          throw new Error(response.error || "Failed to mark YouTube card as swiped");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to mark YouTube card as swiped:", errorMsg);
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

  // Create test room with Q Street topic and players (no posts/votes)
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

  // Create rant test room with Q Street topic and pre-filled rants
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
        const response = await api.getRoomStatus(roomId);
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

  const getSubHeards = useCallback(async (userId: string) => {
    type Response = { subHeards: SubHeard[]; };
    return safelyMakeApiCall<Response>(() => api.getSubHeards(userId));
  }, []);

  const getExplorableSubHeards = useCallback(async (userId: string) => {
    return safelyMakeApiCall<SubHeard[]>(() => api.getExplorableSubHeards(userId));
  }, []);

  const joinSubHeard = useCallback(async (subHeardName: string, userId: string) => {
    return safelyMakeApiCall<undefined>(() => api.joinSubHeard(subHeardName, userId))
  }, []);

  const leaveSubHeard = useCallback(async (subHeardName: string, userId: string) => {
    return safelyMakeApiCall<undefined>(() => api.leaveSubHeard(subHeardName, userId))
  }, []);

  const getEnrichmentConfig = useCallback(async () => {
    return safelyMakeApiCall<EnrichmentConfig>(() =>
      api.getEnrichmentConfig(),
    );
  }, []);

  const setEnrichmentConfig = useCallback(
    async (config: EnrichmentConfig) => {
      return safelyMakeApiCall<EnrichmentConfig>(() =>
        api.setEnrichmentConfig(config),
      );
    },
    [],
  );

  const runEnrichmentNow = useCallback(async () => {
    return safelyMakeApiCall<{
      roomId: string;
      statementIds: string[];
    }>(() => api.runEnrichmentNow());
  }, []);

  // Reset session (full logout)
  const resetSession = useCallback(() => {
    setUser(null);
    setActiveRooms([]);
    setRoomStatements({});
    setError(null);
    clearUserId();
    clearSessionId();
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const storedUserId = getUserId();
      if (storedUserId) {
        const loadedUser = await loadUserUsingStoredId(storedUserId);
  
        if (loadedUser) {
          const sessionId = getSessionId();
          if (!sessionId) {
            await initializeSessionForLegacyUser(storedUserId);
          }
          api.trackActivity(storedUserId).catch((err) => {
            console.error("Failed to track activity on init:", err);
          });
        } else {
          console.log("User session expired or invalid");
        }
      }


      setLoading(false);
    };

    init();
  }, [loadUserUsingStoredId, initializeSessionForLegacyUser]);

  let returnObj = {
    user,
    activeRooms,
    currentSubHeard,
    loading,
    error,
    sendMagicLink,
    verifyMagicLink,
    sendSmsCode,
    verifySmsCode,
    addPhoneToAccount,
    addEmailToAccount,
    createAnonymousUser,
    createRoom,
    joinRoom,
    submitStatement,
    voteOnStatement,
    flagStatement,
    voteViaFlyer,
    submitFlyerEmail,
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
    getRoomAnalysis,
    markChanceCardSwiped,
    markYouTubeCardSwiped,
    getSubHeards,
    getExplorableSubHeards,
    joinSubHeard,
    leaveSubHeard,
    getEnrichmentConfig,
    setEnrichmentConfig,
    runEnrichmentNow,
  };

  if (showcase || showcaseOverrides) {
    returnObj = {
      ...returnObj,
      sendMagicLink: async (email: string) => { 
        console.log("[Showcase] sendMagicLink called"); 
        return { success: true };
      },
      verifyMagicLink: async (code: string) => { 
        console.log("[Showcase] verifyMagicLink called"); 
        return { success: true };
      },
      sendSmsCode: async (phone: string, requireExisting?: boolean) => { 
        console.log("[Showcase] sendSmsCode called"); 
        return { success: true };
      },
      verifySmsCode: async (phone: string, code: string) => { 
        console.log("[Showcase] verifySmsCode called"); 
        return { success: true };
      },
      addPhoneToAccount: async (userId: string, phone: string, code: string) => {
        console.log("[Showcase] addPhoneToAccount called");
        return { success: true };
      },
      addEmailToAccount: async (email: string) => {
        console.log("[Showcase] addEmailToAccount called");
        return { success: true };
      },
      submitFlyerEmail: async (email: string) => {
        console.log("[Showcase] submitFlyerEmail called");
        return { success: true };
      },
      createAnonymousUser: async () => {
        console.log("[Showcase] createAnonymousUser called");
        return { success: true };
      },
      setRoomInactive: async () => { 
        console.log("[Showcase] setRoomInactive called"); 
        return true; 
      },
      getRoomStatements: async () => { 
        console.log("[Showcase] getRoomStatements called"); 
        return [];
      },
      flagStatement: async (statementId: string, roomId: string) => {
        console.log("[Showcase] flagStatement called");
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
      markYouTubeCardSwiped: async (userId: string, roomId: string) => {
        console.log("[Showcase] markYouTubeCardSwiped called");
      },
      getSubHeards: async (userId: string) => {
        console.log("[Showcase] getSubHeards called");
        return { success: true  };
      },
      getExplorableSubHeards: async (userId: string) => {
        console.log("[Showcase] getExplorableSubHeards called");
        return { success: true  };
      },
      joinSubHeard: async (subHeardName: string, userId: string) => {
        console.log("[Showcase] joinSubHeard called");
        return { success: true };
      },
      leaveSubHeard: async (subHeardName: string, userId: string) => {
        console.log("[Showcase] leaveSubHeard called");
        return { success: true };
      },
      getEnrichmentConfig: async () => {
        console.log("[Showcase] getEnrichmentConfig called");
        return { success: true };
      },
      setEnrichmentConfig: async (config: EnrichmentConfig) => {
        console.log("[Showcase] setEnrichmentConfig called");
        return { success: true };
      },
      runEnrichmentNow: async () => {
        console.log("[Showcase] runEnrichmentNow called");
        return { success: true };
      },
      ...showcaseOverrides,
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