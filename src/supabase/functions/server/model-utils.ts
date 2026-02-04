import { insert } from "./db-utils.ts";
import { NewUserReport } from "./types.tsx";

export const insertUserReport = async (report: NewUserReport) => {
  return insert<NewUserReport>("user_reports", report);
};