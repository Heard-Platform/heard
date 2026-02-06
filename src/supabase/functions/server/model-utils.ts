import { insert, selectAll } from "./db-utils.ts";
import { NewUserReport, UserReport } from "./types.tsx";

export const insertUserReport = async (report: NewUserReport) => {
  return insert<NewUserReport>("user_reports", report);
};

export const getUserReports = async () => {
  return selectAll<UserReport>("user_reports");
};