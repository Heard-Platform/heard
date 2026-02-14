import { insert, selectAll } from "./db-utils.ts";
import { NewUserReport, UserPresence, UserReport } from "./types.tsx";

const PRESENCE_TTL = 10000;

export const insertPresence = async (userId: string) => {
  return insert<{ userId: string }>("presence", { userId });
};

export const getRecentPresences = async () => {
  return selectAll<UserPresence[]>("presence", (q) =>
    q.gt("lastUpdated", Date.now() - PRESENCE_TTL)
  );
};

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