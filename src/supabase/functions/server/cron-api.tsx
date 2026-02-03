import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getAllDebates, getUser } from "./kv-utils.tsx";
import { getFrontendUrl } from "./utils.tsx";
import { sendSms } from "./twilio-service.tsx";
import type { DebateRoom } from "./types.tsx";
import { getStatements } from "./debate-api.tsx";

const app = new Hono();

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
  async (c: any) => {
    try {
      const authHeader = c.req.header("Authorization");
      const cronSecret = Deno.env.get("CRON_SECRET");
      
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return c.json({ error: "Unauthorized" }, 401);
      }

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

      return c.json({ 
        processed: results.length,
        results: results
      });
    } catch (error) {
      console.error("Error in celebration cron job:", error);
      return c.json(
        { error: "Failed to process celebration cron job" },
        500,
      );
    }
  },
);

export { app as cronApi };