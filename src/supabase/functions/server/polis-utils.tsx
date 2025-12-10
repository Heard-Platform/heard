import * as kv from "./kv_store.tsx";
import { generateId } from "./utils.tsx";
import type {
  UserSession,
  VoteType,
  DebateRoom,
  Statement,
  Vote,
} from "./types.tsx";
import Papa from "npm:papaparse@5.4.1";
import {
  createRoom,
  createStatement,
  createUser,
  createVote,
} from "./kv-utils.tsx";

export type PolisStatement = {
  authorId: number;
  commentBody: string;
};

export type PolisVoteRow = {
  participantId: number;
  votesByPostId: Record<number, -1 | 0 | 1>;
};

export type AssembledData = {
  users: UserSession[];
  userIdMap: Map<number, string>;
  room: DebateRoom;
  roomIndex: {
    roomId: string;
    topic: string;
    isActive: boolean;
    createdAt: number;
    subHeard: string;
  };
  statements: Statement[];
  votes: Vote[];
};

function parseCSV(
  csvText: string,
): Array<Record<string, string>> {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0) {
    console.error("CSV parsing errors:", result.errors);
    throw new Error(
      `CSV parsing failed: ${result.errors[0].message}`,
    );
  }

  return result.data as Array<Record<string, string>>;
}

export function parsePolisStatements(
  csvText: string,
): PolisStatement[] {
  const rows = parseCSV(csvText);
  return rows
    .map((row) => ({
      authorId: parseInt(row["author-id"]),
      commentBody: row["comment-body"],
    }))
    .filter(
      (stmt) => stmt.commentBody && stmt.commentBody.trim(),
    );
}

export function parsePolisVotes(
  csvText: string,
  statementCount: number,
): PolisVoteRow[] {
  const rows = parseCSV(csvText);
  return rows.map((row) => {
    const participantId = parseInt(row["participant"]);
    const votesByPostId: Record<number, -1 | 0 | 1> = {};

    for (let postId = 0; postId < statementCount; postId++) {
      const voteValue = row[postId.toString()];
      if (voteValue === "1") {
        votesByPostId[postId] = 1;
      } else if (voteValue === "-1") {
        votesByPostId[postId] = -1;
      } else if (voteValue === "0") {
        votesByPostId[postId] = 0;
      }
    }

    return { participantId, votesByPostId };
  });
}

function assembleUsers(
  polisStatements: PolisStatement[],
  polisVotes: PolisVoteRow[],
): { users: UserSession[]; userIdMap: Map<number, string> } {
  const users: UserSession[] = [];
  const userIdMap: Map<number, string> = new Map();

  const maxParticipantIndex = Math.max(
    ...polisVotes.map((row) => row.participantId),
    ...polisStatements.map((stmt) => stmt.authorId),
  );

  const now = Date.now();
  for (let i = 0; i <= maxParticipantIndex; i++) {
    const userId = generateId();
    const user: UserSession = {
      id: userId,
      nickname: `Polis User ${i + 1}`,
      email: `polis-${userId}@test-heard.com`,
      score: 0,
      streak: 0,
      lastActive: now,
      isTestUser: true,
      isDeveloper: false,
      createdAt: now,
    };

    users.push(user);
    userIdMap.set(i, userId);
  }

  return { users, userIdMap };
}

function assembleStatements(
  polisStatements: PolisStatement[],
  userIdMap: Map<number, string>,
  roomId: string,
  importerId: string,
  baseTimestamp: number,
): {
  statements: Statement[];
  statementIdMap: Map<number, string>;
} {
  const statementIdMap: Map<number, string> = new Map();
  const statements: Statement[] = [];

  for (let i = 0; i < polisStatements.length; i++) {
    const polisStmt = polisStatements[i];
    const statementId = generateId();
    const authorUserId = userIdMap.get(polisStmt.authorId);

    const statement: Statement = {
      id: statementId,
      text: polisStmt.commentBody,
      author: authorUserId || importerId,
      agrees: 0,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      roomId,
      timestamp: baseTimestamp + i,
      round: 1,
      voters: {},
    };

    statementIdMap.set(i, statementId);
    statements.push(statement);
  }

  return { statements, statementIdMap };
}

function assembleVotes(
  polisVotes: PolisVoteRow[],
  userIdMap: Map<number, string>,
  statementIdMap: Map<number, string>,
  statements: Statement[],
  baseTimestamp: number,
): Vote[] {
  const votes: Vote[] = [];
  let voteCount = 0;

  for (const polisVote of polisVotes) {
    const userId = userIdMap.get(polisVote.participantId);

    if (!userId) {
      console.warn(
        `No user found for participant ${polisVote.participantId}`,
      );
      continue;
    }

    for (const [statementIndex, voteValue] of Object.entries(
      polisVote.votesByPostId,
    )) {
      const statementId = statementIdMap.get(
        parseInt(statementIndex),
      );
      if (!statementId) {
        continue;
      }

      let voteType: VoteType;
      if (voteValue === 1) {
        voteType = "agree";
      } else if (voteValue === -1) {
        voteType = "disagree";
      } else {
        voteType = "pass";
      }

      const voteId = generateId();
      const vote: Vote = {
        id: voteId,
        statementId,
        userId,
        voteType,
        timestamp: baseTimestamp + voteCount,
      };

      votes.push(vote);
      voteCount++;

      const statement = statements.find(
        (s) => s.id === statementId,
      );
      if (statement) {
        statement.voters[userId] = voteType;

        if (voteType === "agree") {
          statement.agrees++;
        } else if (voteType === "disagree") {
          statement.disagrees++;
        } else if (voteType === "pass") {
          statement.passes++;
        }
      }
    }
  }

  return votes;
}

export function assemblePolisData(
  debateName: string,
  subHeard: string,
  importerId: string,
  polisStatements: PolisStatement[],
  polisVotes: PolisVoteRow[],
): AssembledData {
  const roomId = generateId();
  const now = Date.now();

  const { users, userIdMap } = assembleUsers(
    polisStatements,
    polisVotes,
  );

  const room: DebateRoom = {
    id: roomId,
    topic: debateName,
    phase: "results",
    gameNumber: 1,
    roundStartTime: now,
    participants: Array.from(userIdMap.values()),
    hostId: importerId,
    isActive: true,
    createdAt: now,
    mode: "host-controlled",
    subHeard,
  };

  const { statements, statementIdMap } = assembleStatements(
    polisStatements,
    userIdMap,
    roomId,
    importerId,
    now,
  );

  const votes = assembleVotes(
    polisVotes,
    userIdMap,
    statementIdMap,
    statements,
    now,
  );

  const roomIndex = {
    roomId,
    topic: debateName,
    isActive: true,
    createdAt: now,
    subHeard,
  };

  return {
    users,
    userIdMap,
    room,
    roomIndex,
    statements,
    votes,
  };
}

export async function importAllData(
  data: AssembledData,
): Promise<void> {
  for (const user of data.users) {
    await createUser(user);
  }

  await createRoom(data.room);

  for (const statement of data.statements) {
    await createStatement(statement);
  }

  for (const vote of data.votes) {
    await createVote(vote);
  }

  console.log(
    `Imported ${data.users.length} users, ${data.statements.length} statements, ${data.votes.length} votes`,
  );
}