import { UserHistorySession } from "../../types";

export const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

export const describeUser = (user: UserHistorySession) => {
  const name = user.nickname || "(no nickname)";
  const contact = user.isAnonymous ? "anonymous" : user.email || "no email";
  return `${name} (${contact})`;
};
