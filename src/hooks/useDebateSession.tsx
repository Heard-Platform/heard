import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import {
  api,
  safelyMakeApiCall,
} from "../utils/api";
import { isValidCachedUser } from "../utils/cache-utils";
import type {
  UserSession,
  DebateRoom,
  NewDebateRoom,
  Statement,
  StatementMerge,
  VoteType,
  AnalysisData,
  SubHeard,
  EnrichmentConfig,
  Event,
  NewEvent,
  GGWashImportResult,
} from "../types";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "../utils/constants/errors";
import { AskTheDataResponse, FlyerVoteResponse, UserSessionResponse } from "../types/api-responses";
import {
  ApiResponse,
  clearSessionId,
  getSessionId,
  setSessionId,
  getCachedUser,
  setCachedUser,
  clearCachedUser,
} from "../utils/api-client";
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
  anonAddEmailAndLogin: (
    email: string,
  ) => Promise<ApiResponse<
    | { requiresOtp: false; user: UserSession }
    | { requiresOtp: true; email: string }
  > | null>;
  createAnonymousUser: () => Promise<ApiResponse<UserSessionResponse> | null>;
  updateAvatar: (avatarAnimal: AvatarAnimal) => Promise<void>;
  createRoom: (newDebate: NewDebateRoom) => Promise<DebateRoom>;
  createEvent: (newEvent: NewEvent) => Promise<Event>;
  submitStatement: (roomId: string, text: string) => Promise<any>;
  voteOnStatement: (
    statementId: string,
    voteType: VoteType,
  ) => Promise<any>;
  flagStatement: (
    statementId: string,
    roomId: string,
    reason: string,
  ) => Promise<void>;
  flagAskTheDataResponse: (
    recordId: string,
    roomId: string,
    reason: string,
  ) => Promise<void>;
  voteViaFlyer: (
    flyerId: string,
    statementId: string,
    vote: VoteType,
    flyerGroup?: number,
  ) => Promise<FlyerVoteResponse | null>;
  submitFlyerEmail: (email: string) => Promise<ApiResponse | null>;
  markChanceCardSwiped: (roomId: string) => Promise<void>;
  markCoverCardSwiped: (roomId: string) => Promise<void>;
  saveDemographicAnswer: (
    questionId: string,
    answer: string | null,
  ) => Promise<ApiResponse | null>;
  loadActiveRooms: (subHeard?: string, targetRoomId?: string) => Promise<DebateRoom[]>;
  setCurrentSubHeard: (subHeard: string | null) => void;
  resetSession: () => void;
  createSeedData: () => Promise<any>;
  createTestRoom: () => Promise<any>;
  createRantTestRoom: () => Promise<any>;
  createRealtimeTestRoom: () => Promise<any>;
  createScalabilityTest: () => Promise<any>;
  updateRoom: (
    roomId: string,
    updates: { topic?: string; description?: string; imageUrl?: string },
  ) => Promise<ApiResponse<{ room: DebateRoom }> | null>;
  setRoomInactive: (roomId: string) => Promise<boolean>;
  roomStatements: Record<string, Statement[]>;
  getRoomStatements: (roomId: string) => Promise<Statement[]>;
  getRoomAnalysis: (roomId: string) => Promise<AnalysisData | null>;
  askTheData: (roomId: string, question: string) => Promise<ApiResponse<AskTheDataResponse>>;
  getStatementMerges: ( roomId: string ) => Promise<StatementMerge[]>;
  createStatementMerge: (
    roomId: string,
    sourceStatementId: string,
    targetStatementId: string,
  ) => Promise<ApiResponse | null>;
  deleteStatementMerge: (
    roomId: string,
    mergeId: string,
  ) => Promise<ApiResponse | null>;
  setResponsesPaused: (
    roomId: string,
    paused: boolean,
  ) => Promise<ApiResponse<{ room: DebateRoom }> | null>;
  createCohostInvite: (roomId: string) => Promise<ApiResponse<{ token: string }> | null>;
  acceptCohostInvite: (roomId: string, token: string) => Promise<ApiResponse | null>;
  clearRoomCohosts: (roomId: string) => Promise<ApiResponse | null>;
  listStatementsForModeration: (roomId: string) => Promise<Statement[]>;
  setStatementHidden: (
    roomId: string,
    statementId: string,
    isHidden: boolean,
  ) => Promise<ApiResponse<{ statement: Statement }> | null>;
  getSubHeards: () => Promise<ApiResponse<{ subHeards: SubHeard[] }> | null>;
  getExplorableSubHeards: () => Promise<ApiResponse<SubHeard[]> | null>;
  joinSubHeard: (subHeardName: string) => Promise<ApiResponse | null>;
  leaveSubHeard: (subHeardName: string) => Promise<ApiResponse | null>;
  createModInvite: (
    subHeardName: string,
  ) => Promise<ApiResponse<{ token: string }> | null>;
  acceptModInvite: (
    subHeardName: string,
    token: string,
  ) => Promise<ApiResponse | null>;
  clearSubHeardMods: (subHeardName: string) => Promise<ApiResponse | null>;
  getEnrichmentConfig: () => Promise<ApiResponse<EnrichmentConfig> | null>;
  setEnrichmentConfig: (
    config: EnrichmentConfig,
  ) => Promise<ApiResponse<EnrichmentConfig> | null>;
  runEnrichmentNow: () => Promise<ApiResponse<{
    roomId: string;
    statementIds: string[];
  }> | null>;
  runGGWashImport: (dryRun?: boolean) => Promise<ApiResponse<GGWashImportResult> | null>;
}

export type OverridableApiMethods = Pick<
  DebateSessionContextType,
  | "user"
  | "safelyGetUser"
  | "getExplorableSubHeards"
  | "createEvent"
  | "anonAddEmailAndLogin"
  | "verifyMagicLink"
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

  const anonAddEmailAndLogin = useCallback(async (email: string) => {
    const response = await api.anonAddEmailAndLogin(email);

    if (response?.data && !response.data.requiresOtp) {
      setUser(response.data.user);
    }

    return response;
  }, [safelyMakeApiCall]);

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
    async (newDebate: NewDebateRoom): Promise<DebateRoom> => {
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
    async (statementId: string, roomId: string, reason: string) => {
      try {
        const response = await api.flagStatement(statementId, roomId, reason);
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

  const flagAskTheDataResponse = useCallback(
    async (recordId: string, roomId: string, reason: string) => {
      try {
        const response = await api.flagAskTheDataResponse(recordId, roomId, reason);
        if (!response.success) {
          throw new Error(response.error || "Failed to flag response");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to flag ask-the-data response:", errorMsg);
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

  const markCoverCardSwiped = useCallback(
    async (roomId: string) => {
      try {
        const response = await api.markCoverCardSwiped(roomId);
        if (!response.success) {
          throw new Error(response.error || "Failed to mark cover card as swiped");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to mark cover card as swiped:", errorMsg);
      }
    }, [],
  );

  const saveDemographicAnswer = useCallback(
    async (questionId: string, answer: string | null) =>
      safelyMakeApiCall<undefined>(() => api.saveDemographicAnswer(questionId, answer)),
    [safelyMakeApiCall],
  );      

  const loadActiveRooms = useCallback(async (subHeard?: string, targetRoomId?: string) => {
    setRoomsLoading(true);
    try {
      const response = await api.getActiveRooms(
        subHeard,
        targetRoomId,
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
  }, []);

  // Create seed data for testing
  const createSeedData = useCallback(async () => {
    try {
      setError(null);
      const response = await api.createSeedData();
      if (response.success && response.data) {
        // Refresh active rooms to show the new test room
        await loadActiveRooms();
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
  }, [loadActiveRooms]);

  // Create test room with Q Street topic and players (no posts/votes)
  const createTestRoom = useCallback(async () => {
    try {
      setError(null);
      const response = await api.createTestRoom();
      if (response.success && response.data) {
        // Refresh active rooms to show the new test room
        await loadActiveRooms();
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
  }, [loadActiveRooms]);

  // Create rant test room with Q Street topic and pre-filled rants
  const createRantTestRoom = useCallback(async () => {
    try {
      setError(null);
      const response = await api.createRantTestRoom();
      if (response.success && response.data) {
        // Refresh active rooms to show the new test room
        await loadActiveRooms();
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
  }, [loadActiveRooms]);

  // Create realtime test room with seed data and 5-minute timer
  const createRealtimeTestRoom = useCallback(async () => {
    try {
      setError(null);
      const response = await api.createRealtimeTestRoom();
      if (response.success && response.data) {
        // Refresh active rooms to show the new test room
        await loadActiveRooms();
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
  }, [loadActiveRooms]);

  const createScalabilityTest = useCallback(async () => {
    try {
      setError(null);
      const response = await api.createScalabilityTest();
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(
          response.error || "Failed to run scalability test",
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("Failed to run scalability test:", errorMsg);
    }
    return null;
  }, []);

  const callRoomMutation = useCallback(
    async (apiCall: () => Promise<ApiResponse<{ room: DebateRoom }>>) => {
      const response = await safelyMakeApiCall<{ room: DebateRoom }>(apiCall);
      if (response?.success && response.data) {
        const updated = response.data.room;
        setActiveRooms((prev) =>
          prev.map((r) =>
            r.id === updated.id ? { ...r, ...updated } : r,
          ),
        );
      }
      return response;
    },
    [safelyMakeApiCall],
  );

  const callRoomStatementMutation = useCallback(
    async (apiCall: () => Promise<ApiResponse<{ statement: Statement }>>) => {
      const response = await safelyMakeApiCall<{ statement: Statement }>(apiCall);
      if (response?.success && response.data) {
        const updated = response.data.statement;
        setRoomStatements((prev) => ({
          ...prev,
          [updated.roomId]: (prev[updated.roomId] || []).map((s) =>
            s.id === updated.id ? updated : s,
          ),
        }));
      }
      return response;
    },
    [safelyMakeApiCall],
  );

  const updateRoom = useCallback(
    (
      roomId: string,
      updates: { topic?: string; description?: string; imageUrl?: string },
    ) => callRoomMutation(() => api.updateRoom(roomId, updates)),
    [callRoomMutation],
  );

  // Mark room as inactive (dev tool)
  const setRoomInactive = useCallback(
    async (roomId: string) => {
      try {
        setError(null);
        const response = await api.setRoomInactive(roomId);
        if (response.success) {
          // Refresh active rooms to remove the inactive room
          await loadActiveRooms();
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
    [loadActiveRooms],
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

  const getStatementMerges = useCallback(
    async (roomId: string) => {
      const response = await safelyMakeApiCall<{
        merges: StatementMerge[];
      }>(() => api.getStatementMerges(roomId))

      return response?.data?.merges || [];
    }
  , [safelyMakeApiCall]);

  const createStatementMerge = useCallback(
    async (roomId: string, sourceStatementId: string, targetStatementId: string) =>
      safelyMakeApiCall(
        () => api.createStatementMerge(roomId, sourceStatementId, targetStatementId)
      )
  , [safelyMakeApiCall]);

  const deleteStatementMerge = useCallback(
    async (roomId: string, mergeId: string) =>
      safelyMakeApiCall<undefined>(() => api.deleteStatementMerge(roomId, mergeId))
  , [safelyMakeApiCall]);

  const setResponsesPaused = useCallback(
    (roomId: string, paused: boolean) =>
      callRoomMutation(() => api.setResponsesPaused(roomId, paused)),
    [callRoomMutation],
  );

  const createCohostInvite = useCallback(
    async (roomId: string) =>
      safelyMakeApiCall<{ token: string }>(() => api.createCohostInvite(roomId)),
    [safelyMakeApiCall],
  );

  const acceptCohostInvite = useCallback(
    async (roomId: string, token: string) =>
      safelyMakeApiCall(() => api.acceptCohostInvite(roomId, token)),
    [safelyMakeApiCall],
  );

  const clearRoomCohosts = useCallback(
    async (roomId: string) =>
      safelyMakeApiCall(() => api.clearRoomCohosts(roomId)),
    [safelyMakeApiCall],
  );

  const listStatementsForModeration = useCallback(
    async (roomId: string) => {
      const response = await safelyMakeApiCall<{
        statements: Statement[];
      }>(() => api.getStatementsForModeration(roomId));

      return response?.data?.statements || [];
    }
  , [safelyMakeApiCall]);

  const setStatementHidden = useCallback(
    (roomId: string, statementId: string, isHidden: boolean) =>
      callRoomStatementMutation(() =>
        api.setStatementHidden(roomId, statementId, isHidden),
      ),
    [callRoomStatementMutation],
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

  const askTheData = useCallback(
    async (roomId: string, question: string) => {
      return api.askTheData(roomId, question);
    },
    [],
  );

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

  const createModInvite = useCallback(async (subHeardName: string) => {
    return safelyMakeApiCall<{ token: string }>(() => api.createModInvite(subHeardName));
  }, []);

  const acceptModInvite = useCallback(async (subHeardName: string, token: string) => {
    return safelyMakeApiCall<undefined>(() => api.acceptModInvite(subHeardName, token));
  }, []);

  const clearSubHeardMods = useCallback(async (subHeardName: string) => {
    return safelyMakeApiCall<undefined>(() => api.clearSubHeardMods(subHeardName));
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

  const runGGWashImport = useCallback(async (dryRun = false) => {
    return safelyMakeApiCall<GGWashImportResult>(() => api.runGGWashImport(dryRun));
  }, []);

  // Reset session (full logout)
  const resetSession = useCallback(() => {
    setUser(null);
    setActiveRooms([]);
    setRoomStatements({});
    setError(null);
    clearSessionId();
  }, []);

  useEffect(() => {
    if (user) {
      setCachedUser(user);
    } else {
      clearCachedUser();
    }
  }, [user]);

  const reloadUser = async () => {
    const response = await api.getUser();
    if (!getSessionId()) return // Logged out mid-request
    
    if (response.success && response.data) {
      setUser(response.data.user);
      api.trackActivity().catch((err) => {
        console.error("Failed to track activity:", err);
      });
    } else if (response.error === "SESSION_EXPIRED") {
      console.warn("Session expired, clearing local data");
      clearSessionId();
      setUser(null);
    }
  };

  const initUser = async () => {
    const sessionId = getSessionId();
    const cachedUser = getCachedUser();

    if (sessionId && isValidCachedUser(cachedUser)) {
      setUser(cachedUser);
      reloadUser().catch((err) => {
        console.error("Background revalidation failed:", err);
      });
    } else if (sessionId) {
      await reloadUser();
    }
    setLoading(false);
  };

  useEffect(() => { initUser(); }, []);

  let returnObj: DebateSessionContextType = {
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
    anonAddEmailAndLogin,
    createAnonymousUser,
    updateAvatar,
    createRoom,
    createEvent,
    submitStatement,
    voteOnStatement,
    flagStatement,
    flagAskTheDataResponse,
    voteViaFlyer,
    submitFlyerEmail,
    loadActiveRooms,
    setCurrentSubHeard,
    resetSession,
    createSeedData,
    createTestRoom,
    createRantTestRoom,
    createRealtimeTestRoom,
    createScalabilityTest,
    updateRoom,
    setRoomInactive,
    roomStatements,
    getRoomStatements,
    getRoomAnalysis,
    getStatementMerges,
    createStatementMerge,
    deleteStatementMerge,
    setResponsesPaused,
    createCohostInvite,
    acceptCohostInvite,
    clearRoomCohosts,
    listStatementsForModeration,
    setStatementHidden,
    markChanceCardSwiped,
    markCoverCardSwiped,
    saveDemographicAnswer,
    getSubHeards,
    getExplorableSubHeards,
    joinSubHeard,
    leaveSubHeard,
    createModInvite,
    acceptModInvite,
    clearSubHeardMods,
    getEnrichmentConfig,
    setEnrichmentConfig,
    runEnrichmentNow,
    runGGWashImport,
    askTheData,
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
      anonAddEmailAndLogin: async (_email: string) => {
        console.log("[Showcase] anonAddEmailAndLogin called");
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
      updateRoom: async () => {
        console.log("[Showcase] updateRoom called");
        return null;
      },
      setRoomInactive: async () => {
        console.log("[Showcase] setRoomInactive called");
        return true;
      },
      getRoomStatements: async () => { 
        console.log("[Showcase] getRoomStatements called"); 
        return [];
      },
      flagStatement: async (statementId: string, roomId: string, reason: string) => {
        console.log("[Showcase] flagStatement called", { reason });
      },
      flagAskTheDataResponse: async (recordId: string, roomId: string, reason: string) => {
        console.log("[Showcase] flagAskTheDataResponse called", { recordId, reason });
      },
      getRoomAnalysis: async () => {
        console.log("[Showcase] getRoomAnalysis called");
        return null;
      },
      getStatementMerges: async () => {
        console.log("[Showcase] getStatementMerges called");
        return [];
      },
      createStatementMerge: async () => {
        console.log("[Showcase] createStatementMerge called");
        return { success: true };
      },
      deleteStatementMerge: async () => {
        console.log("[Showcase] deleteStatementMerge called");
        return { success: true };
      },
      setResponsesPaused: async () => {
        console.log("[Showcase] setResponsesPaused called");
        return null;
      },
      createCohostInvite: async () => {
        console.log("[Showcase] createCohostInvite called");
        return { success: true, data: { token: "showcase-token" } };
      },
      acceptCohostInvite: async () => {
        console.log("[Showcase] acceptCohostInvite called");
        return { success: true };
      },
      clearRoomCohosts: async (roomId: string) => {
        console.log("[Showcase] clearRoomCohosts called", roomId);
        return { success: true };
      },
      listStatementsForModeration: async () => {
        console.log("[Showcase] listStatementsForModeration called");
        return [];
      },
      setStatementHidden: async () => {
        console.log("[Showcase] setStatementHidden called");
        return { success: true };
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
      createScalabilityTest: async () => {
        console.log("[Showcase] createScalabilityTest called");
        return { success: true };
      },
      markChanceCardSwiped: async () => {
        console.log("[Showcase] markChanceCardSwiped called");
      },
      markCoverCardSwiped: async () => {
        console.log("[Showcase] markCoverCardSwiped called");
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
      createModInvite: async (subHeardName: string) => {
        console.log("[Showcase] createModInvite called", subHeardName);
        return { success: true, data: { token: "showcase-mod-token" } };
      },
      acceptModInvite: async (subHeardName: string, token: string) => {
        console.log("[Showcase] acceptModInvite called", subHeardName, token);
        return { success: true };
      },
      clearSubHeardMods: async (subHeardName: string) => {
        console.log("[Showcase] clearSubHeardMods called", subHeardName);
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
      runGGWashImport: async () => {
        console.log("[Showcase] runGGWashImport called");
        return { success: true };
      },
      askTheData: async (roomId: string, question: string) => {
        console.log("[Showcase] askTheData called", { roomId, question });
        await new Promise((resolve) => setTimeout(resolve, 600));
        return {
          success: true,
          data: {
            id: "showcase-ask-the-data-record",
            status: "answered" as const,
            response: `This is a demo answer to: "${question}"`,
          },
        };
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