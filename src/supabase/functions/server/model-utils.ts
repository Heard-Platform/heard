import { deleteRecord, insert, selectAll, selectAllWithoutLimit, updateMany, upsert } from "./db-utils.ts";
import {
  AvatarAnimal,
  DemographicAnswer,
  DemographicQuestion,
  InternalVar,
  InternalVarKey,
  NewDemographicAnswer,
  NewUserEvent,
  NewUserReport,
  RoomFollow,
  RoomView,
  StatementMerge,
  UserEvent,
  UserPresence,
  UserReport
} from "./types.tsx";

const PRESENCE_TTL = 10_000;

export const updatePresence = async (
  userId: string,
  currentRoomIndex: number,
  avatarAnimal: AvatarAnimal
) =>
  upsert(
    "presences",
    { userId, currentRoomIndex, avatarAnimal, lastUpdated: new Date().toISOString() },
    "userId"
  );

export const getRecentPresences = async () =>
  selectAll<UserPresence>(
    "presences",
    {},
    (q: any) => q.gte("lastUpdated", new Date(Date.now() - PRESENCE_TTL).toISOString())
  );

export const insertUserReport = async (report: NewUserReport) => {
  return insert<NewUserReport>("user_reports", report);
};

export const getUserReports = async () => {
  return selectAll<UserReport>("user_reports");
};

export const insertDemographicQuestion = async (question: DemographicQuestion) => {
  return insert<DemographicQuestion>("demographic_questions", question);
};

export const getDemographicQuestionsForRoom = async (roomId: string) => {
  return selectAll<DemographicQuestion>("demographic_questions", { roomId });
};

export const getDemographicQuestionsForRooms = async (roomIds: string[]) => {
  return selectAll<DemographicQuestion>(
    "demographic_questions",
    {},
    (q: any) => q.in("roomId", roomIds),
  );
};

export const getDemographicAnswersForQuestionIds = async (
  questionIds: number[],
) => {
  return selectAll<DemographicAnswer>(
    "demographic_answers",
    {},
    (q: any) => q.in("questionId", questionIds),
  );
};

export const saveDemographicAnswer = async (answer: NewDemographicAnswer) => {
  return upsert("demographic_answers", answer, "userId,questionId");
};

export const getAnsweredDemographicQuestionIds = async (
  userId: string,
): Promise<number[]> => {
  const answers = await selectAll<DemographicAnswer>(
    "demographic_answers",
    { userId },
  );
  return answers.map((a) => a.questionId);
};

export const insertFlyerEmail = async (email: string) => {
  return insert<{ email: string }>("flyer_emails", { email });
};

export const getFlyerScans = async () => {
  return selectAll<{ flyer: string }>("flyer_scans");
};

export const insertFlyerScan = async (
  flyer: string,
  userId?: string,
) => {
  return insert<{ flyer: string; userId?: string }>("flyer_scans", {
    flyer,
    ...(userId ? { userId } : {}),
  });
};

export const getFlyerEmails = async () => {
  return selectAll<{ email: string }>("flyer_emails");
};

export const insertOrgEmail = async (email: string) => {
  return insert<{ email: string }>("org_signups", { email });
};

export const getOrgEmails = async () => {
  return selectAll<{ email: string }>("org_signups");
};

export const getMergesForRoom = async (roomId: string): Promise<StatementMerge[]> => {
  return selectAll<StatementMerge>("statement_merges", { roomId });
};

export const getCertifyCardEvents = async () => {
  return selectAll<UserEvent>(
    "user_events",
    {},
    (q: any) => q.like("type", "certify_card_%").select("type"),
  );
};

export const getCommunityTeaserEvents = async () => {
  return selectAll<UserEvent>(
    "user_events",
    {},
    (q: any) => q.like("type", "community_teaser_%").select("type"),
  );
};

export const getOneBillionEvents = async () => {
  return selectAll<UserEvent>(
    "user_events",
    {},
    (q: any) => q.like("type", "one_billion_%").select("type, userId"),
  );
};

export const getFundingEvents = async () => {
  return selectAll<UserEvent>(
    "user_events",
    {},
    (q: any) => q.like("type", "funding_%").select("type, userId"),
  );
};

export const getOrganizersEvents = async () => {
  return selectAll<UserEvent>(
    "user_events",
    {},
    (q: any) => q.like("type", "organizers_%").select("type, userId"),
  );
};

export const insertAnalyticsEvent = async (event: NewUserEvent) => {
  return insert<NewUserEvent>( "user_events", event );
};

export const getUniqueUserIdsForEvent = async (type: string): Promise<Set<string>> => {
  const events = await selectAll<UserEvent>("user_events", { type });
  return new Set(events.map(e => e.userId).filter((id): id is string => id !== null));
};

export const getEventsOfType = async (type: string): Promise<UserEvent[]> => {
  return selectAll<UserEvent>("user_events", { type });
};

export const getRecentUserEvents = async (sinceTs: number): Promise<UserEvent[]> =>
  selectAll<UserEvent>(
    "user_events",
    {},
    (q: any) => q.gte("createdAt", new Date(sinceTs).toISOString()),
  );

export const tagEventsWithSession = async (eventIds: string[], sessionId: string) =>
  updateMany("user_events", eventIds, { sessionId });

export const setInternalVar = async (key: InternalVarKey, value: any) =>
  upsert(
    "internal_vars",
    { key, value: JSON.stringify(value) },
    "key"
  );
  
export const getInternalVar = async <T>(key: InternalVarKey): Promise<T | null> =>
  selectAll<InternalVar>("internal_vars", { key })
    .then((vars) => (vars[0] ? JSON.parse(vars[0].value) : null));

export const saveCoverCardSwipe = async (userId: string, roomId: string) =>
  upsert("cover_card_swipes", { userId, roomId, swipedAt: Date.now() }, "userId,roomId");

export const getCoverCardSwipedRoomIds = async (userId: string): Promise<Set<string>> => {
  const rows = await selectAll<{ roomId: string }>("cover_card_swipes", { userId });
  return new Set(rows.map((r) => r.roomId));
};

export const deleteCoverCardSwipesForUser = async (userId: string) =>
  deleteRecord("cover_card_swipes", { userId });

export const saveCardSwipe = async (userId: string, roomId: string, cardType: string) =>
  upsert("card_swipes", { userId, roomId, cardType, swipedAt: Date.now() }, "userId,roomId,cardType");

export const getCardSwipesForUser = async (userId: string): Promise<{ roomId: string; cardType: string }[]> =>
  selectAll<{ roomId: string; cardType: string }>("card_swipes", { userId });

export const deleteCardSwipesForUser = async (userId: string) =>
  deleteRecord("card_swipes", { userId });

export const saveRoomView = async (view: RoomView) =>
  upsert("room_views", view, "userId,roomId");

export const getRoomViewsForUser = async (userId: string): Promise<RoomView[]> =>
  selectAll<RoomView>("room_views", { userId });

export const getAllRoomViews = async (): Promise<RoomView[]> =>
  selectAllWithoutLimit<RoomView>("room_views");

export const deleteRoomView = async (userId: string, roomId: string) =>
  deleteRecord("room_views", { userId, roomId });

export const bulkUpsertRoomViews = async (views: RoomView[]) =>
  upsert("room_views", views as any, "userId,roomId");

export const saveRoomFollow = async (userId: string, roomId: string) =>
  upsert(
    "room_follows",
    { userId, roomId, followedAt: Date.now() },
    "userId,roomId",
  );

export const getFollowedRoomIds = async (userId: string): Promise<Set<string>> => {
  const rows = await selectAll<{ roomId: string }>("room_follows", { userId });
  return new Set(rows.map((r) => r.roomId));
};

export const bulkUpsertRoomFollows = async (follows: RoomFollow[]) =>
  upsert("room_follows", follows as any, "userId,roomId");

export const recordRoomEngagement = async (
  userId: string,
  roomId: string,
  now: number = Date.now(),
) => {
  await Promise.all([
    saveRoomFollow(userId, roomId),
    saveRoomView({ userId, roomId, lastSeenAt: now }),
  ]);
};