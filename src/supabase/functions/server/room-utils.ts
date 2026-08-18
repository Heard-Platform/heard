import {
  getStatementsForRoom,
  getStatementsForRoomIncludingHidden,
  getVotesForStatement,
} from "./kv-utils.tsx";
import { getMergesForRoom } from "./model-utils.ts";
import {
  DebateRoom,
  Statement,
  StatementMerge,
  VoteType,
} from "./types.tsx";

type RoomPartial = Pick<
  DebateRoom,
  | "id"
  | "topic"
  | "description"
  | "hostId"
  | "participants"
  | "hostId"
  | "subHeard"
  | "endTime"
  | "imageUrl"
  | "youtubeUrl"
  | "allowAnonymous"
  | "eventId"
>;

export const createNewRoomData = (
  roomPartial: RoomPartial,
): DebateRoom => {
  return {
    id: roomPartial.id,
    topic: roomPartial.topic,
    description: roomPartial.description,
    phase: "round1",
    subPhase: "posting",
    gameNumber: 1,
    roundStartTime: Date.now(),
    participants: roomPartial.participants,
    hostId: roomPartial.hostId,
    isActive: true,
    createdAt: Date.now(),
    mode: "realtime",
    rantFirst: true,
    subHeard: roomPartial.subHeard,
    endTime: roomPartial.endTime,
    imageUrl: roomPartial.imageUrl,
    youtubeUrl: roomPartial.youtubeUrl,
    allowAnonymous: roomPartial.allowAnonymous,
    eventId: roomPartial.eventId,
  };
};

export function isRoomEnded(room: DebateRoom): boolean {
  return !!room.endTime && Date.now() >= room.endTime;
}

export async function getRoomParticipants(
  roomId: string,
): Promise<string[]> {
  const statements = await getStatementsForRoomIncludingHidden(roomId);
  const votesByStatement = await Promise.all(
    statements.map((statement) => getVotesForStatement(statement.id)),
  );

  const participantIds = new Set<string>();
  for (const statement of statements) {
    participantIds.add(statement.author);
  }
  for (const votes of votesByStatement) {
    for (const vote of votes) {
      participantIds.add(vote.userId);
    }
  }
  return Array.from(participantIds);
}

export function applyStatementMerges(
  statements: Statement[],
  merges: StatementMerge[],
): Statement[] {
  if (merges.length === 0) return statements;

  const sourceIds = new Set(merges.map((m) => m.sourceStatementId));

  const sourcesForTarget = new Map<string, Statement[]>();
  for (const merge of merges) {
    const source = statements.find(
      (s) => s.id === merge.sourceStatementId,
    );
    if (!source) continue;
    const group = sourcesForTarget.get(merge.targetStatementId) ?? [];
    group.push(source);
    sourcesForTarget.set(merge.targetStatementId, group);
  }

  return statements
    .filter((s) => !sourceIds.has(s.id))
    .map((s) => {
      const sources = sourcesForTarget.get(s.id);
      if (!sources || sources.length === 0) return s;

      const mergedVoters: { [userId: string]: VoteType } = {};
      for (const source of sources)
        Object.assign(mergedVoters, source.voters ?? {});
      Object.assign(mergedVoters, s.voters ?? {});

      let agrees = 0,
        disagrees = 0,
        passes = 0,
        superAgrees = 0;
      for (const voteType of Object.values(mergedVoters)) {
        if (voteType === "agree") agrees++;
        else if (voteType === "disagree") disagrees++;
        else if (voteType === "pass") passes++;
        else if (voteType === "super_agree") {
          superAgrees++;
          agrees++;
        }
      }

      const mergedFrom = sources.map((src) => ({
        id: src.id,
        text: src.text,
      }));

      return {
        ...s,
        voters: mergedVoters,
        agrees,
        disagrees,
        passes,
        superAgrees,
        mergedFrom,
      };
    });
}

export async function getUsableStatementsForRoom(
  roomId: string,
): Promise<Statement[]> {
  const [statements, merges] = await Promise.all([
    getStatementsForRoom(roomId),
    getMergesForRoom(roomId),
  ]);
  return applyStatementMerges(statements, merges);
}
