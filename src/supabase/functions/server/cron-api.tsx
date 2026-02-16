import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getAllDebates, getUser } from "./kv-utils.tsx";
import { getFrontendUrl } from "./utils.tsx";
import { sendSms } from "./twilio-service.tsx";
import type { DebateRoom, Statement } from "./types.tsx";
import { getStatements, generateId, saveDebateRoom } from "./debate-api.tsx";
import { getAutopopulatorConfig } from "./internal-config-api.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { getCommunity, saveCommunity, saveStatement } from "./kv-utils.tsx";
import { validateDeveloper } from "./internal-utils.ts";

const app = new Hono();

async function validateCronAuth(c: any, next: any) {
  const authHeader = c.req.header("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    await next();
    return;
  }
  
  return validateDeveloper(c, next);
}

export async function sendDebateCompletionCelebration(room: DebateRoom) {
  try {
    const host = await getUser(room.hostId);
    if (!host || !host.phoneNumber || !host.phoneVerified) {
      console.log(`Cannot send celebration SMS: host ${room.hostId} has no verified phone`);
      return;
    }

    const statements = await getStatements(room.id);
    const totalVotes = statements.reduce((sum, stmt) => {
      return sum + stmt.superAgrees + stmt.agrees + stmt.disagrees + stmt.passes;
    }, 0);

    const participantCount = room.participants.length;
    const topic = room.topic.length > 60 ? room.topic.substring(0, 60) + "..." : room.topic;

    const celebrationMessage = `🎉 Your debate "${topic}" just wrapped! ${participantCount} debater${participantCount !== 1 ? 's' : ''} cast ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}. Check the results at ${getFrontendUrl()}/room/${room.id}`;

    const { success } = await sendSms(host.phoneNumber, celebrationMessage);
    if (success) {
      console.log(`Celebration SMS sent to host ${host.id} for room ${room.id}`);
    } else {
      console.error(`Failed to send celebration SMS to host ${host.id} for room ${room.id}`);
    }
  } catch (error) {
    console.error("Error sending celebration SMS:", error);
  }
}

app.post(
  "/make-server-f1a393b4/cron/send-completion-celebrations",
  validateCronAuth,
  defineRoute(
    {},
    async () => {
      const now = Date.now();
      const twentyMinutesAgo = now - (20 * 60 * 1000);

      const allRooms = await getAllDebates();
      const recentlyEndedRooms = allRooms.filter(room => 
        room.endTime && 
        room.endTime >= twentyMinutesAgo && 
        room.endTime <= now
      );

      console.log(`Found ${recentlyEndedRooms.length} recently ended debates`);

      const results = [];
      for (const room of recentlyEndedRooms) {
        const alreadySent = await kv.get(`celebration-sms-sent:${room.id}`);
        if (alreadySent) {
          console.log(`Celebration SMS already sent for room ${room.id}`);
          continue;
        }

        try {
          await sendDebateCompletionCelebration(room);
          await kv.set(`celebration-sms-sent:${room.id}`, "true");
          results.push({ roomId: room.id, success: true });
        } catch (error) {
          console.error(`Failed to send celebration for room ${room.id}:`, error);
          results.push({ 
            roomId: room.id, 
            success: false, 
            error: error.message 
          });
        }
      }

      return { 
        processed: results.length,
        results: results
      };
    },
    "Failed to process celebration cron job"
  ),
);

async function ensureTestCommunityExists() {
  const testCommunity = await getCommunity("test");
  if (!testCommunity) {
    await saveCommunity({
      name: "test",
      isPrivate: false,
      adminId: "system",
      hostOnlyPosting: false,
    });
  }
}

async function createMockDebatePost(): Promise<{ roomId: string; statementIds: string[] }> {
  await ensureTestCommunityExists();

  const roomId = generateId();
  const mockUserId = "auto-populator-bot";

  const debateRoom: DebateRoom = {
    id: roomId,
    topic: "What's the best way to spend a lazy Sunday afternoon?",
    phase: "round1",
    subPhase: "posting",
    gameNumber: 1,
    roundStartTime: Date.now(),
    participants: [mockUserId],
    hostId: mockUserId,
    isActive: true,
    createdAt: Date.now(),
    mode: "realtime",
    rantFirst: true,
    subHeard: "test",
    endTime: Date.now() + (7 * 24 * 60 * 60 * 1000),
    allowAnonymous: false,
  };

  await saveDebateRoom(debateRoom);

  const mockStatements = [
    "Reading a good book while sipping on coffee",
    "Binge-watching your favorite TV series",
    "Going for a nature walk or hike",
  ];

  const statementIds: string[] = [];

  for (const text of mockStatements) {
    const statementId = generateId();
    const statement: Statement = {
      id: statementId,
      roomId: roomId,
      text: text,
      author: mockUserId,
      timestamp: Date.now(),
      superAgrees: 0,
      agrees: 0,
      disagrees: 0,
      passes: 0,
      voters: {},
      round: 1,
    };
    await saveStatement(statement);
    statementIds.push(statementId);
  }

  return { roomId, statementIds };
}

app.post(
  "/make-server-f1a393b4/cron/auto-populate-feed",
  validateCronAuth,
  defineRoute(
    { forceRun: { type: 'boolean', required: false } },
    async (params: { forceRun?: boolean }) => {
      console.log("Auto-populate feed cron job triggered");

      const config = await getAutopopulatorConfig();
      
      if (!config.enabled && !params.forceRun) {
        console.log("Autopopulator is disabled");
        return { 
          skipped: true,
          message: "Autopopulator is disabled"
        };
      }

      if (!params.forceRun) {
        const probability = 1 / config.averageIntervalMins;
        const randomValue = Math.random();
        
        if (randomValue >= probability) {
          console.log(`Skipping this run (random: ${randomValue.toFixed(3)}, probability: ${probability})`);
          return { 
            skipped: true,
            message: "Skipped based on probability",
            probability,
            randomValue
          };
        }

        console.log(`Proceeding with autopopulation (random: ${randomValue.toFixed(3)}, probability: ${probability})`);
      } else {
        console.log("Force run enabled, bypassing probability check");
      }

      const { roomId, statementIds } = await createMockDebatePost();

      return { 
        message: "Successfully created mock debate post",
        roomId,
        statementIds,
        forceRun: params.forceRun || false,
      };
    },
    "Failed to process auto-populate feed cron job"
  ),
);

export { app as cronApi };