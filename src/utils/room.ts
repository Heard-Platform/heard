import type { Statement } from "../types";

export const getUniqueParticipants = (statements: Statement[]): Set<string> => {
  const participants = new Set<string>();

  statements.forEach((s) => {
    participants.add(s.author);
    Object.keys(s.voters ?? {}).forEach((userId) => participants.add(userId));
  });

  return participants;
};
