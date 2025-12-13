import { EmailData, SubHeardMembership } from "./email-types.ts";
import * as kvUtils from "./kv-utils.tsx";
import type { Statement, DebateRoom } from "./types.tsx";

export async function generateRealEmailData(
  userId: string,
): Promise<EmailData> {
  console.log(
    `[generateRealEmailData] Starting data generation for userId: ${userId}`,
  );

  const emailData: EmailData = {
    conversationsStarted: [],
    takesPosted: [],
    conversationsParticipated: [],
    communities: [],
  };

  try {
    console.log(`[generateRealEmailData] Fetching all rooms...`);
    const allRooms = await kvUtils.getAllDebates<DebateRoom>();
    console.log(
      `[generateRealEmailData] Found ${allRooms.length} total rooms`,
    );

    const roomsStarted = allRooms.filter(
      (room) => room.hostId === userId,
    );
    console.log(
      `[generateRealEmailData] User started ${roomsStarted.length} rooms`,
    );

    console.log(`[generateRealEmailData] Fetching all statements...`);
    const allStatements = await kvUtils.getByPrefixParsed<Statement>(
      "statement:",
    );
    console.log(
      `[generateRealEmailData] Found ${allStatements.length} total statements`,
    );

    const userStatements = allStatements.filter(
      (stmt) => stmt.author === userId,
    );
    console.log(
      `[generateRealEmailData] User posted ${userStatements.length} statements`,
    );

    const participatedRoomIds = new Set(
      userStatements.map((stmt) => stmt.roomId),
    );
    const roomsParticipated = allRooms.filter(
      (room) =>
        participatedRoomIds.has(room.id) && room.hostId !== userId,
    );
    console.log(
      `[generateRealEmailData] User participated in ${roomsParticipated.length} rooms (not hosted)`,
    );

    console.log(
      `[generateRealEmailData] Processing conversations started...`,
    );
    for (const room of roomsStarted) {
      const roomStatements = allStatements.filter(
        (s) => s.roomId === room.id,
      );
      const totalVotes = roomStatements.reduce(
        (sum, s) =>
          sum +
          (s.agrees || 0) +
          (s.disagrees || 0) +
          (s.passes || 0),
        0,
      );

      const topTakes = roomStatements
        .filter((s) => s.author !== userId)
        .sort(
          (a, b) =>
            b.agrees +
            b.disagrees +
            b.passes -
            (a.agrees + a.disagrees + a.passes),
        )
        .slice(0, 2);

      console.log(
        `[generateRealEmailData] Room "${room.topic}": ${roomStatements.length} takes, ${totalVotes} votes`,
      );

      emailData.conversationsStarted.push({
        title: room.topic,
        newTakes: roomStatements.length,
        newVotes: totalVotes,
        featuredTakes: topTakes.map((take) => ({
          text: take.text,
          agrees: take.agrees || 0,
          disagrees: take.disagrees || 0,
        })),
      });
    }

    console.log(`[generateRealEmailData] Processing takes posted...`);
    for (const stmt of userStatements) {
      const room = allRooms.find((r) => r.id === stmt.roomId);
      if (room) {
        emailData.takesPosted.push({
          text: stmt.text,
          conversationTitle: room.topic,
          agrees: stmt.agrees || 0,
          disagrees: stmt.disagrees || 0,
          totalVotes:
            (stmt.agrees || 0) +
            (stmt.disagrees || 0) +
            (stmt.passes || 0),
        });
      }
    }

    console.log(
      `[generateRealEmailData] Processing conversations participated...`,
    );
    for (const room of roomsParticipated) {
      const roomStatements = allStatements.filter(
        (s) => s.roomId === room.id,
      );
      const totalVotes = roomStatements.reduce(
        (sum, s) =>
          sum +
          (s.agrees || 0) +
          (s.disagrees || 0) +
          (s.passes || 0),
        0,
      );

      const topTake = roomStatements
        .filter((s) => s.author !== userId)
        .sort(
          (a, b) =>
            b.agrees +
            b.disagrees +
            b.passes -
            (a.agrees + a.disagrees + a.passes),
        )[0];

      if (topTake) {
        emailData.conversationsParticipated.push({
          title: room.topic,
          newTakes: roomStatements.length,
          newVotes: totalVotes,
          featuredTake: {
            text: topTake.text,
            agrees: topTake.agrees || 0,
            disagrees: topTake.disagrees || 0,
          },
        });
      }
    }

    console.log(`[generateRealEmailData] Processing communities...`);
    const userSubHeardMemberships = await kvUtils.getByPrefixParsed<
      SubHeardMembership
    >(`subheard_member:${userId}:`);
    const userSubHeards = userSubHeardMemberships.map(
      (m) => m.subHeard,
    );
    console.log(
      `[generateRealEmailData] User is member of ${userSubHeards.length} subheards`,
    );

    for (const subHeardName of userSubHeards) {
      const subHeardRooms = allRooms.filter(
        (r) => r.subHeard === subHeardName && r.isActive,
      );

      if (subHeardRooms.length > 0) {
        const activeParticipants = new Set();
        subHeardRooms.forEach((room) => {
          room.participants?.forEach((p: string) =>
            activeParticipants.add(p),
          );
        });

        const featuredRoom = subHeardRooms.sort(
          (a, b) => b.createdAt - a.createdAt,
        )[0];
        const featuredRoomStatements = allStatements.filter(
          (s) => s.roomId === featuredRoom.id,
        );

        emailData.communities.push({
          name: subHeardName,
          newConversations: subHeardRooms.length,
          activeMembers: activeParticipants.size,
          featuredConvo: {
            title: featuredRoom.topic,
            newTakes: featuredRoomStatements.length,
            totalParticipants: featuredRoom.participants?.length || 0,
          },
        });
      }
    }

    emailData.conversationsStarted =
      emailData.conversationsStarted.slice(0, 3);
    emailData.takesPosted = emailData.takesPosted
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 3);
    emailData.conversationsParticipated =
      emailData.conversationsParticipated.slice(0, 3);
    emailData.communities = emailData.communities.slice(0, 2);

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
