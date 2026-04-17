import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import {
  api,
  safelyMakeApiCall,
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
  Event,
  NewEvent,
} from "../types";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "../utils/constants/errors";
import { FlyerVoteResponse, UserSessionResponse } from "../types/api-responses";
import { ApiResponse, clearSessionId, setSessionId } from "../utils/api-client";
import { AvatarAnimal } from "../utils/constants/avatars";

interface DebateSessionContextType {
  user: UserSession | null;
  activeRooms: DebateRoom[];
  currentSubHeard: string | null;
  loading: boolean;
  roomsLoading: boolean;
  error: string | null;
  safelyGetUser: () => UserSession;
  sendMagicLink: (email: string) => Promise<ApiResponse | null>;
  verifyMagicLink: (code: string) => Promise<ApiResponse<UserSessionResponse> | null>;
  sendSmsCode: (phone: string, requireExisting?: boolean) => Promise<ApiResponse | null>;
  verifySmsCode: (phone: string, code: string) => Promise<ApiResponse<UserSessionResponse> | null>;
  addPhoneToAccount: (phone: string, code: string) => Promise<ApiResponse<{ user: UserSession }> | null>;
  addEmailToAccount: (email: string) => Promise<ApiResponse<{ user: UserSession }> | null>;
  createAnonymousUser: () => Promise<ApiResponse<UserSessionResponse> | null>;
  updateAvatar: (avatarAnimal: AvatarAnimal) => Promise<void>;
  createRoom: (
    newDebate: NewDebateRoom,
    autoJoin?: boolean,
  ) => Promise<DebateRoom>;
  createEvent: (newEvent: NewEvent) => Promise<Event>;
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
    flyerGroup?: number,
  ) => Promise<FlyerVoteResponse | null>;
  submitFlyerEmail: (email: string) => Promise<ApiResponse | null>;
  markChanceCardSwiped: (roomId: string) => Promise<void>;
  markYouTubeCardSwiped: (roomId: string) => Promise<void>;
  saveDemographicAnswer: (
    questionId: string,
    answer: string | null,
  ) => Promise<ApiResponse | null>;
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
  getSubHeards: () => Promise<ApiResponse<{ subHeards: SubHeard[] }> | null>;
  getExplorableSubHeards: () => Promise<ApiResponse<SubHeard[]> | null>;
  joinSubHeard: (subHeardName: string) => Promise<ApiResponse<undefined> | null>;
  leaveSubHeard: (subHeardName: string) => Promise<ApiResponse<undefined> | null>;
  getEnrichmentConfig: () => Promise<ApiResponse<EnrichmentConfig> | null>;
  setEnrichmentConfig: (
    config: EnrichmentConfig,
  ) => Promise<ApiResponse<EnrichmentConfig> | null>;
  runEnrichmentNow: () => Promise<ApiResponse<{
    roomId: string;
    statementIds: string[];
  }> | null>;
}

export type OverridableApiMethods = Pick<
  DebateSessionContextType,
  "safelyGetUser" | "getExplorableSubHeards" | "createEvent"
>;

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
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomStatements, setRoomStatements] = useState<
    Record<string, Statement[]>
  >({});

  const safelyGetUser = useCallback(() => {
    if (!user) {
      throw new Error("User not loaded");
    }
    return user;
  }, [user]);

  const setUserAndSession = useCallback((providedUser: UserSession, sessionId: string) => {
    try {
      setError(null);
      setUser(providedUser);
      setSessionId(sessionId);
      api.trackActivity().catch((err) => {
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

  const addPhoneToAccount = useCallback(async (phone: string, code: string) => {
    const response = await safelyMakeApiCall<{ user: UserSession }>(() => api.addPhoneToAccount(phone, code));
    if (response?.data?.user) {
      setUser(response.data.user);
    }
    return response;
  }, [safelyMakeApiCall]);

  const addEmailToAccount = useCallback(async (email: string) => {
    const response = await safelyMakeApiCall<{ user: UserSession }>(
      () => api.addEmailToAccount(email),
    );
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

  const updateAvatar = useCallback(async (avatarAnimal: AvatarAnimal) => {
    const response = await safelyMakeApiCall<{ user: UserSession }>(() => api.updateAvatar(avatarAnimal));
    if (response?.data?.user) {
      setUser(response.data.user);
    }
  }, [safelyMakeApiCall]);

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
      const response = await api.createRoom(newDebate);

      if (response.success && response.data) {
        const roomData = response.data;

        updateUserScoreFromResponse(roomData);

        if (autoJoin) {
          await api.joinRoom(roomData.id);
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

  // Create event
  const createEvent = useCallback(
    async (newEvent: NewEvent): Promise<Event> => {
      setError(null);
      const response = await safelyMakeApiCall(() =>
        api.createEvent(newEvent),
      );

      if (response?.success && response.data) {
        return response.data.event;
      } else {
        const errorMsg = response?.error || "Failed to create event";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [user, safelyMakeApiCall],
  );

  // Join room (backend only - no local state)
  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!user) return null;

      try {
        setError(null);
        const response = await api.joinRoom(roomId) as any;
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
      flyerGroup?: number,
    ) => {
      const response = await safelyMakeApiCall<FlyerVoteResponse>(() =>
        api.voteViaFlyer(flyerId, statementId, vote, flyerGroup),
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
    async (roomId: string) => {
      try {
        const response = await api.markChanceCardSwiped(roomId);
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
    async (roomId: string) => {
      try {
        const response = await api.markYouTubeCardSwiped(roomId);
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

  const saveDemographicAnswer = useCallback(
    async (questionId: string, answer: string | null) =>
      safelyMakeApiCall<undefined>(() => api.saveDemographicAnswer(questionId, answer)),
    [safelyMakeApiCall],
  );      

  // Get active rooms - uses currentSubHeard from state
  const getActiveRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const response = await api.getActiveRooms(
        currentSubHeard || undefined,
      ) as any;
      if (response.success && response.data) {
        setActiveRooms(response.data.rooms || []);
        setRoomsLoading(false);
        return response.data.rooms || [];
      }
    } catch (err) {
      console.error("Failed to fetch active rooms:", err);
    }
    setRoomsLoading(false);
    return [];
  }, [currentSubHeard]);

  // Create seed data for testing
  const createSeedData = useCallback(async () => {
    try {
      setError(null);
      const response = await api.createSeedData();
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
  }, [getActiveRooms]);

  // Create test room with Q Street topic and players (no posts/votes)
  const createTestRoom = useCallback(async () => {
    try {
      setError(null);
      const response = await api.createTestRoom();
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
  }, [getActiveRooms]);

  // Create rant test room with Q Street topic and pre-filled rants
  const createRantTestRoom = useCallback(async () => {
    try {
      setError(null);
      const response = await api.createRantTestRoom();
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
  }, [getActiveRooms]);

  // Create realtime test room with seed data and 5-minute timer
  const createRealtimeTestRoom = useCallback(async () => {
    try {
      setError(null);
      const response = await api.createRealtimeTestRoom();
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
  }, [getActiveRooms]);

  // Mark room as inactive (dev tool)
  const setRoomInactive = useCallback(
    async (roomId: string) => {
      try {
        setError(null);
        const response = await api.setRoomInactive(roomId);
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
    [getActiveRooms],
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

  const getSubHeards = useCallback(async () => {
    type Response = { subHeards: SubHeard[]; };
    return safelyMakeApiCall<Response>(() => api.getSubHeards());
  }, []);

  const getExplorableSubHeards = useCallback(async () => {
    return safelyMakeApiCall<SubHeard[]>(() => api.getExplorableSubHeards());
  }, []);

  const joinSubHeard = useCallback(async (subHeardName: string) => {
    return safelyMakeApiCall<undefined>(() => api.joinSubHeard(subHeardName))
  }, []);

  const leaveSubHeard = useCallback(async (subHeardName: string) => {
    return safelyMakeApiCall<undefined>(() => api.leaveSubHeard(subHeardName))
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
    clearSessionId();
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const response = await api.getUser();
      if (response.success && response.data) {
        const user = response.data.user;
        setUser(user);
        api.trackActivity().catch((err) => {
          console.error("Failed to track activity on init:", err);
        });
      } else if (response.error === "SESSION_EXPIRED") {
        console.error("Session expired, clearing local data");
        clearSessionId();
        return null;
      }

      setLoading(false);
    };

    init();
  }, []);

  let returnObj = {
    user,
    activeRooms,
    currentSubHeard,
    loading,
    roomsLoading,
    error,
    safelyGetUser,
    sendMagicLink,
    verifyMagicLink,
    sendSmsCode,
    verifySmsCode,
    addPhoneToAccount,
    addEmailToAccount,
    createAnonymousUser,
    updateAvatar,
    createRoom,
    createEvent,
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
    saveDemographicAnswer,
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
      addPhoneToAccount: async (phone: string, code: string) => {
        console.log("[Showcase] addPhoneToAccount called");
        return { success: true };
      },
      addEmailToAccount: async (email: string) => {
        console.log("[Showcase] addEmailToAccount called");
        return { success: true };
      },
      updateAvatar: async (avatarAnimal: AvatarAnimal) => {
        console.log("[Showcase] updateAvatar called");
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
      markChanceCardSwiped: async () => {
        console.log("[Showcase] markChanceCardSwiped called");
      },
      markYouTubeCardSwiped: async () => {
        console.log("[Showcase] markYouTubeCardSwiped called");
      },
      saveDemographicAnswer: async (questionId: string, answer: string | null) => {
        console.log("[Showcase] saveDemographicAnswer called");
        return { success: true };
      },
      getSubHeards: async () => {
        console.log("[Showcase] getSubHeards called");
        return { success: true  };
      },
      getExplorableSubHeards: async () => {
        console.log("[Showcase] getExplorableSubHeards called");
        return { success: true  };
      },
      joinSubHeard: async (subHeardName: string) => {
        console.log("[Showcase] joinSubHeard called");
        return { success: true };
      },
      leaveSubHeard: async (subHeardName: string) => {
        console.log("[Showcase] leaveSubHeard called");
        return { success: true };
      },
      createEvent: async (newEvent: NewEvent): Promise<Event> => {
        console.log("[Showcase] createEvent called", newEvent);
        return {
          id: "showcase-event-123",
          name: newEvent.name,
          subtitle: newEvent.subtitle,
          communityName: newEvent.communityName,
          totalMembers: 0,
          rooms: [],
          creatorId: "showcase-user",
          createdAt: Date.now(),
        };
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