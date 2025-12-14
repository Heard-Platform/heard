import { getStatementsForUser } from "./db-utils.ts";
import { EmailData, SubHeardMembership } from "./email-types.ts";
import { getAllDebates, getByPrefixParsed, getStatement, getStatementsForRoom, getVotesForUser } from "./kv-utils.tsx";
import type { Statement, DebateRoom } from "./types.tsx";

async function getConversationsStarted(
  userId: string,
  sinceTimestamp: number,
  allConvos: DebateRoom[],
) {
  console.log(`[getConversationsStarted] Processing...`);
  
  const convosStarted = allConvos.filter(
    (convo) => convo.hostId === userId && convo.createdAt >= sinceTimestamp,
  );
  
  console.log(
    `[getConversationsStarted] User started ${convosStarted.length} rooms since timestamp`,
  );

  const convoEmailData = [];
  
  for await (const convo of convosStarted) {
    const statements = await getStatementsForRoom(convo.id);
    const recentStatements = statements.filter(
      (s) => s.timestamp >= sinceTimestamp,
    );
    
    const totalVotes = recentStatements.reduce(
      (sum, s) => sum + s.superAgrees + s.agrees + s.disagrees,
      0,
    );

    const topStatements = recentStatements
      .filter((s) => s.author !== userId)
      .sort(
        (a, b) =>
          (b.superAgrees + b.agrees + b.disagrees)
          - (a.superAgrees + a.agrees + a.disagrees),
      )
      .slice(0, 2);

    console.log(
      `[getConversationsStarted] Convo "${convo.topic}": ${recentStatements.length} statements, ${totalVotes} votes`,
    );

    convoEmailData.push({
      title: convo.topic,
      newTakes: recentStatements.length,
      newVotes: totalVotes,
      featuredTakes: topStatements.map((statement) => ({
        text: statement.text,
        agrees: statement.agrees || 0,
        disagrees: statement.disagrees || 0,
      })),
    });
  }
  
  return convoEmailData.slice(0, 3);
}

async function getTakesPosted(
  sinceTimestamp: number,
  allConvos: DebateRoom[],
  userStatements: Statement[],
) {
  console.log(`[getTakesPosted] Processing...`);
  
  userStatements = userStatements.filter(
    (statement) => statement.timestamp >= sinceTimestamp,
  );
  
  console.log(
    `[getTakesPosted] User posted ${userStatements.length} statements since timestamp`,
  );

  const statementsPosted = [];
  
  for (const statement of userStatements) {
    const convo = allConvos.find((r) => r.id === statement.roomId);
    if (convo) {
      statementsPosted.push({
        text: statement.text,
        conversationTitle: convo.topic,
        agrees: statement.superAgrees + statement.agrees,
        disagrees: statement.disagrees,
        totalVotes: statement.superAgrees + statement.agrees + statement.disagrees
      });
    }
  }
  
  return statementsPosted.sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 3);
}

async function getConversationsParticipated(
  userId: string,
  sinceTimestamp: number,
  allConvos: DebateRoom[],
  userStatements: Statement[],
) {
  console.log(`[getConversationsParticipated] Processing...`);
  
  let userVotes = await getVotesForUser(userId);
  userVotes = userVotes.filter(
    (vote) => vote.timestamp >= sinceTimestamp,
  );

  userStatements = userStatements.filter(
    (statements) => statements.timestamp >= sinceTimestamp,
  );
  
  let recentConvoIds = new Set<string>();
  userStatements.forEach((statement) => recentConvoIds.add(statement.roomId));

  const votedStatementIds = new Set(userVotes.map((v) => v.statementId));

  for await (const statementId of votedStatementIds) {
    const statement = await getStatement(statementId);
    if (statement) {
      recentConvoIds.add(statement.roomId);
    }
  }

  const convos = allConvos.filter((r) => recentConvoIds.has(r.id));
  
  console.log(
    `[getConversationsParticipated] User participated in ${convos.length} convos since timestamp (not hosted)`,
  );

  const conversationsParticipated = [];
  
  for (const convo of convos) {
    let convoStatements = await getStatementsForRoom(convo.id);
    convoStatements = convoStatements.filter(
      (s) => s.timestamp >= sinceTimestamp,
    );
    
    const totalVotes = convoStatements.reduce(
      (sum, s) =>
        sum + s.superAgrees + s.agrees + s.disagrees,
      0,
    );

    const topStatement = convoStatements
      .filter((s) => s.author !== userId)
      .sort(
        (a, b) =>
          (b.superAgrees + b.agrees + b.disagrees) -
          (a.superAgrees + a.agrees + a.disagrees),
      )[0];

    if (topStatement) {
      conversationsParticipated.push({
        title: convo.topic,
        newTakes: convoStatements.length,
        newVotes: totalVotes,
        featuredTake: {
          text: topStatement.text,
          agrees: topStatement.agrees || 0,
          disagrees: topStatement.disagrees || 0,
        },
      });
    }
  }
  
  return conversationsParticipated.slice(0, 3);
}

async function getCommunities(
  userId: string,
  sinceTimestamp: number,
  allConvos: DebateRoom[],
) {
  console.log(`[getCommunities] Processing...`);
  
  const userCommunityMemberships = await getByPrefixParsed<
    SubHeardMembership
  >(`subheard_member:${userId}:`);
  const userCommunities = userCommunityMemberships.map(
    (m) => m.subHeard,
  );
  
  console.log(
    `[getCommunities] User is member of ${userCommunities.length} communities`,
  );

  const communities = [];
  
  for await (const communityName of userCommunities) {
    const convos = allConvos.filter(
      (r) => r.subHeard === communityName && r.isActive && r.createdAt >= sinceTimestamp,
    );

    if (convos.length > 0) {
      const activeParticipants = new Set();
      convos.forEach((convo) => {
        convo.participants.forEach((p: string) =>
          activeParticipants.add(p),
        );
      });

      const featuredConvo = convos.sort(
        (a, b) => b.createdAt - a.createdAt,
      )[0];
      let convoStatements = await getStatementsForRoom(featuredConvo.id);
      convoStatements = convoStatements.filter(
        (s) => s.timestamp >= sinceTimestamp,
      );

      communities.push({
        name: communityName,
        newConversations: convos.length,
        activeMembers: activeParticipants.size,
        featuredConvo: {
          title: featuredConvo.topic,
          newTakes: convoStatements.length,
          totalParticipants: featuredConvo.participants.length || 0,
        },
      });
    }
  }
  
  return communities.slice(0, 2);
}

export async function generateRealEmailData(
  userId: string,
  sinceTimestamp: number,
): Promise<EmailData> {
  console.log(
    `[generateRealEmailData] Starting data generation for userId: ${userId}, sinceTimestamp: ${sinceTimestamp}`,
  );

  const emailData: EmailData = {
    conversationsStarted: [],
    takesPosted: [],
    conversationsParticipated: [],
    communities: [],
  };

  try {
    console.log(`[generateRealEmailData] Fetching all rooms...`);
    const allRooms = await getAllDebates<DebateRoom>();
    console.log(
      `[generateRealEmailData] Found ${allRooms.length} total rooms`,
    );

    console.log(`[generateRealEmailData] Fetching user statements...`);
    const userStatements = await getStatementsForUser(userId);
    console.log(
      `[generateRealEmailData] Found ${userStatements.length} total user statements`,
    );

    emailData.conversationsStarted = await getConversationsStarted(
      userId,
      sinceTimestamp,
      allRooms,
    );
    
    emailData.takesPosted = await getTakesPosted(
      sinceTimestamp,
      allRooms,
      userStatements,
    );
    
    emailData.conversationsParticipated = await getConversationsParticipated(
      userId,
      sinceTimestamp,
      allRooms,
      userStatements,
    );
    
    emailData.communities = await getCommunities(
      userId,
      sinceTimestamp,
      allRooms,
    );

    console.log(`[generateRealEmailData] Final counts:`);
    console.log(
      `  - Conversations started: ${emailData.conversationsStarted.length}`,
    );
    console.log(`  - Takes posted: ${emailData.takesPosted.length}`);
    console.log(
      `  - Conversations participated: ${emailData.conversationsParticipated.length}`,
    );
    console.log(`  - Communities: ${emailData.communities.length}`);
  } catch (error) {
    console.error(
      "[generateRealEmailData] Error generating email data:",
      error,
    );
    console.error(
      "[generateRealEmailData] Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
  }

  return emailData;
}

export function hasEmailContent(data: EmailData): boolean {
  return (
    data.conversationsStarted.length > 0 ||
    data.takesPosted.length > 0 ||
    data.conversationsParticipated.length > 0 ||
    data.communities.length > 0
  );
}