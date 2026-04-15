import { Hono } from "npm:hono";
import {
  getAllSubHeards, getActivitiesForDate,
  getAllRealUsers,
  getAllRealDebates,
  getAllActivityRecords,
  getAllStatements,
  getAllVotes,
} from "./kv-utils.tsx";
import { getAllRecords } from "./db-utils.ts";
import type { Session } from "./types.tsx";
import { getFlyerEmails } from "./model-utils.ts";
import { generateSparklineData, getDateString, calculateRetention } from "./stats-utils.ts";

const app = new Hono();

// Public stats endpoint - platform-wide statistics with 7-day trends
app.get("/make-server-f1a393b4/public-stats", async (c) => {
  try {
    const users = await getAllRealUsers();
    const totalUsers = users.length;
    const usersSparkline = generateSparklineData(users, 7);

    const subHeards = await getAllSubHeards();
    const totalSubHeards = subHeards.length;
    const subHeardsSparkline = generateSparklineData(
      subHeards,
      7,
    );

    const debates = await getAllRealDebates();
    const totalDebates = debates.length;
    const debatesSparkline = generateSparklineData(debates, 7);

    return c.json({
      totalUsers,
      totalSubHeards,
      totalDebates,
      usersSparkline,
      subHeardsSparkline,
      debatesSparkline,
    });
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return c.json(
      { error: "Failed to fetch public stats" },
      500,
    );
  }
});

// Maximum days to look back for activity data in retention calculations
const MAX_ACTIVITY_LOOKBACK_DAYS = 90;

// Retention stats endpoint - user retention rates based on account creation
app.get("/make-server-f1a393b4/stats/retention", async (c) => {
  try {
    const allUsers = await getAllRealUsers();
    const now = Date.now();

    const activitiesByUser = new Map<string, Set<string>>();

    for (let i = 0; i < MAX_ACTIVITY_LOOKBACK_DAYS; i++) {
      const dateStr = getDateString(i);
      const activitiesForDate =
        await getActivitiesForDate(dateStr);

      activitiesForDate.forEach((activity: any) => {
        if (activity.userId) {
          if (!activitiesByUser.has(activity.userId)) {
            activitiesByUser.set(
              activity.userId,
              new Set<string>(),
            );
          }
          activitiesByUser.get(activity.userId)!.add(dateStr);
        }
      });
    }

    const d1Retention = calculateRetention({
      allUsers,
      activitiesByUser,
      now,
      minAgeDays: 2,
      maxAgeDays: 7,
      activityStartDays: 1,
      activityEndDays: 2,
    });

    const d7Retention = calculateRetention({
      allUsers,
      activitiesByUser,
      now,
      minAgeDays: 14,
      maxAgeDays: 30,
      activityStartDays: 7,
      activityEndDays: 14,
    });

    const d30Retention = calculateRetention({
      allUsers,
      activitiesByUser,
      now,
      minAgeDays: 60,
      maxAgeDays: 90,
      activityStartDays: 30,
      activityEndDays: 60,
    });

    return c.json({
      d1Retention,
      d7Retention,
      d30Retention,
    });
  } catch (error) {
    console.error("Error calculating retention stats:", error);
    return c.json(
      { error: "Failed to calculate retention stats" },
      500,
    );
  }
});

app.get("/make-server-f1a393b4/stats/funnel", async (c) => {
  try {
    const allUsers = await getAllRealUsers();
    const nonDevUsers = allUsers.filter(user => !user.isDeveloper);

    const usersWithFlyers = nonDevUsers.filter(user => user.flyerId);
    const usersWithFlyersAndAccounts = usersWithFlyers.filter(user => !user.isAnonymous);
    const flyerEmails = await getFlyerEmails();

    const usersWithAccounts = nonDevUsers.filter((user) => !user.isAnonymous);
    const usersWithAccountsCount = usersWithAccounts.length;

    const userActivityRecords = await getAllActivityRecords();
    
    let usersWhoTookAction = []
    let usersWhoTookActionTwoDays = [];
    let usersWhoTookActionTenDays = [];

    for (const user of usersWithAccounts) {
      const activities = userActivityRecords.filter(record => record.userId === user.id);
      const uniqueDates = new Set(activities.map(a => a.date));
      
      if (uniqueDates.size >= 1) {
        usersWhoTookAction.push(user.id);
      }
      if (uniqueDates.size >= 2) {
        usersWhoTookActionTwoDays.push(user.id);
      }
      if (uniqueDates.size >= 10) {
        usersWhoTookActionTenDays.push(user.id);
      }
    }

    return c.json({
      users: nonDevUsers.length,
      flyerUsers: usersWithFlyers.length,
      flyerEmails: flyerEmails.length,
      flyerUsersWithAccounts: usersWithFlyersAndAccounts.length,
      createdAccount: usersWithAccountsCount,
      tookAction: usersWhoTookAction.length,
      tookActionTwoDays: usersWhoTookActionTwoDays.length,
      tookActionTenDays: usersWhoTookActionTenDays.length,
    });
  } catch (error) {
    console.error("Error calculating funnel metrics:", error);
    return c.json(
      { error: "Failed to calculate funnel metrics" },
      500,
    );
  }
});

app.get("/make-server-f1a393b4/stats/live-activity", async (c) => {
  try {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    console.log(`[LiveActivity] Fetching live activity since ${new Date(tenMinutesAgo).toISOString()}...`);

    const [users, statements, votes, subHeards, sessions] = await Promise.all([
      getAllRealUsers(),
      getAllStatements(),
      getAllVotes(),
      getAllSubHeards(),
      getAllRecords<Session>("session:"),
    ]);

    type EventType = "vote" | "statement" | "user" | "community" | "session";
    type ActivityEvent = {
      type: EventType;
      timestamp: number;
      id: string;
      label: string;
      meta?: Record<string, string>;
    };

    const events: ActivityEvent[] = [];

    const ts = (val: number | string | undefined): number => {
      if (!val) return 0;
      const n = Number(val);
      return isNaN(n) ? new Date(val).getTime() : n;
    };

    for (const user of users) {
      const t = ts(user.createdAt);
      if (t > tenMinutesAgo) {
        events.push({
          type: "user",
          timestamp: t,
          id: user.id,
          label: user.nickname || user.id.substring(0, 8),
        });
      }
    }

    for (const statement of statements) {
      const t = ts(statement.timestamp);
      if (t > tenMinutesAgo) {
        events.push({
          type: "statement",
          timestamp: t,
          id: statement.id,
          label: statement.text.length > 100 ? statement.text.substring(0, 100) + "…" : statement.text,
          meta: { roomId: statement.roomId },
        });
      }
    }

    for (const vote of votes) {
      const t = ts(vote.timestamp);
      if (t > tenMinutesAgo) {
        events.push({
          type: "vote",
          timestamp: t,
          id: vote.id,
          label: vote.voteType,
          meta: { statementId: vote.statementId },
        });
      }
    }

    for (const subHeard of subHeards) {
      const t = ts(subHeard.createdAt);
      if (t > tenMinutesAgo) {
        events.push({
          type: "community",
          timestamp: t,
          id: subHeard.name,
          label: subHeard.name,
        });
      }
    }

    for (const session of sessions) {
      const t = ts(session.createdAt);
      if (t > tenMinutesAgo) {
        events.push({
          type: "session",
          timestamp: t,
          id: session.id,
          label: session.userId.substring(0, 8),
        });
      }
    }

    events.sort((a, b) => b.timestamp - a.timestamp);

    return c.json({ events, fetchedAt: now });
  } catch (error) {
    console.error("Error fetching live activity:", error);
    return c.json({ error: "Failed to fetch live activity" }, 500);
  }
});

export { app as statsApi };