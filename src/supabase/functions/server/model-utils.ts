import { insert, selectAll, upsert } from "./db-utils.ts";
import { NewUserReport, UserPresence, UserReport } from "./types.tsx";

const PRESENCE_TTL = 10_000;

export const updatePresence = async (
  userId: string,
  currentRoomIndex: number,
) =>
  upsert(
    "presences",
    { userId, currentRoomIndex, lastUpdated: new Date().toISOString() },
    "userId"
  );

export const getRecentPresences = async () =>
  selectAll<UserPresence>(
    "presences",
    (q) => q.gte("lastUpdated", new Date(Date.now() - PRESENCE_TTL).toISOString())
  );

export const insertUserReport = async (report: NewUserReport) => {
  return insert<NewUserReport>("user_reports", report);
};

export const getUserReports = async () => {
  return selectAll<UserReport>("user_reports");
};

export const insertFlyerEmail = async (email: string) => {
  return insert<{ email: string }>("flyer_emails", { email });
};

export const getFlyerEmails = async () => {
  return selectAll<{ email: string }>("flyer_emails");
};