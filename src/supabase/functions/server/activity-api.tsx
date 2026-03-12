import { Hono } from "npm:hono";
import moment from "npm:moment@2.30.1";
import * as kv from "./kv_store.tsx";
import { validateSession } from "./auth-utils.ts";

const app = new Hono();

function getDateString(date: Date = new Date()): string {
  return moment(date).format('YYYY-MM-DD');
}

function getDaysAgo(days: number): string {
  return moment().subtract(days, 'days').format('YYYY-MM-DD');
}

app.post("/make-server-f1a393b4/activity/track", validateSession, async (c) => {
  try {
    const userId = c.get("userId");

    const today = getDateString();
    const key = `user_activity:${today}:${userId}`;
    
    await kv.set(key, {
      userId,
      date: today,
      timestamp: Date.now(),
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Error tracking user activity:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Failed to track activity" },
      500
    );
  }
});

// Get activity metrics (public for community admins)
app.get("/make-server-f1a393b4/activity/public-metrics", async (c) => {
  try {
    const allRecords: Array<{ userId: string; date: string; timestamp: number }> = [];
    const dailyBreakdown: Array<{ date: string; activeUsers: number }> = [];

    for (let i = 0; i < 30; i++) {
      const dateStr = getDaysAgo(i);
      const records = await kv.getByPrefix(`user_activity:${dateStr}:`);
      
      dailyBreakdown.unshift({
        date: dateStr,
        activeUsers: records.length,
      });

      records.forEach((record: any) => {
        if (record.userId && record.date) {
          allRecords.push({
            userId: record.userId,
            date: record.date,
            timestamp: record.timestamp,
          });
        }
      });
    }

    const today = getDateString();
    const dauRecords = allRecords.filter(r => r.date === today);
    const dau = dauRecords.length;

    const wauUserIds = new Set<string>();
    allRecords.forEach(record => {
      const daysDiff = moment().diff(moment(record.date), 'days');
      if (daysDiff < 7) {
        wauUserIds.add(record.userId);
      }
    });
    const wau = wauUserIds.size;

    const mauUserIds = new Set<string>();
    allRecords.forEach(record => {
      mauUserIds.add(record.userId);
    });
    const mau = mauUserIds.size;

    return c.json({
      dau,
      wau,
      mau,
      dailyBreakdown,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error calculating activity metrics:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Failed to calculate metrics" },
      500
    );
  }
});

export { app as activityApi };