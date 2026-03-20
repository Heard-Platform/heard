import { insert, selectAll, upsert } from "./db-utils.ts";
import {
  InternalVar,
  InternalVarKey,
  NewUserReport,
  UserPresence,
  UserReport,
} from "./types.tsx";

const PRESENCE_TTL = 10_000;

export const updatePresence = async (
  userId: string,
  currentRoomIndex: number,
  avatarAnimal: string,
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

export const insertFlyerEmail = async (email: string) => {
  return insert<{ email: string }>("flyer_emails", { email });
};

export const getFlyerEmails = async () => {
  return selectAll<{ email: string }>("flyer_emails");
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