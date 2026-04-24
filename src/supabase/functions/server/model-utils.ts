import { insert, selectAll, upsert } from "./db-utils.ts";
import {
  AvatarAnimal,
  DemographicAnswer,
  DemographicQuestion,
  InternalVar,
  InternalVarKey,
  NewDemographicAnswer,
  NewUserEvent,
  NewUserReport,
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

export const insertAnalyticsEvent = async (event: NewUserEvent) => {
  return insert<NewUserEvent>( "user_events", event );
};

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