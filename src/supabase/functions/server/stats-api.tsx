import { Hono } from "npm:hono";
import {
  getAllSubHeards, getActivitiesForDate,
  getAllRealUsers,
  getAllRealDebates,
  getAllActivityRecords
} from "./kv-utils.tsx";
import type { User } from "./types.tsx";
import { getFlyerEmails } from "./model-utils.ts";

const app = new Hono();

export const generateSparklineData = (
  items: any[],
  daysBack = 7,
  now = Date.now(),
) => {
  const dayInMs = 24 * 60 * 60 * 1000;

  const buckets = Array.from({ length: daysBack }, (_, i) => {
    const day = daysBack - i - 1;
    const timestamp = now - day * dayInMs;
    return { day: i, count: 0, timestamp };
  });

  items.forEach((item) => {
    const itemTime = item.createdAt
      ? new Date(item.createdAt).getTime()
      : item.lastSeen || item.timestamp || 0;
    const daysAgo = Math.floor((now - itemTime) / dayInMs);

    if (daysAgo >= 0 && daysAgo < daysBack) {
      const bucketIndex = daysBack - daysAgo - 1;
      if (buckets[bucketIndex]) {
        buckets[bucketIndex].count++;
      }
    }
  });

  return buckets;
};

const getDateString = (daysAgo = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

// Maximum days to look back for activity data in retention calculations
const MAX_ACTIVITY_LOOKBACK_DAYS = 90;

function calculateRetention({
  allUsers,
  activitiesByUser,
  now,
  minAgeDays,
  maxAgeDays,
  activityStartDays,
  activityEndDays,
}: {
  allUsers: User[];
  activitiesByUser: Map<string, Set<string>>;
  now: number;
  minAgeDays: number;
  maxAgeDays: number;
  activityStartDays: number;
  activityEndDays: number;
}) {
  const dayInMs = 24 * 60 * 60 * 1000;
  const minAgeMs = minAgeDays * dayInMs;
  const maxAgeMs = maxAgeDays * dayInMs;

  // Total users in the cohort (regardless of age)
  const cohortUsers = allUsers.filter((user) => {
    if (!user.createdAt) return false;
    const createdTime = new Date(user.createdAt).getTime();
    const age = now - createdTime;
    return age <= maxAgeMs;
  });

  // Users old enough to have completed the retention window
  const eligibleUsers = allUsers.filter((user) => {
    if (!user.createdAt) return false;
    const createdTime = new Date(user.createdAt).getTime();
    const age = now - createdTime;
    return age >= minAgeMs && age <= maxAgeMs;
  });

  if (eligibleUsers.length === 0) {
    return {
      rate: 0,
      eligible: 0,
      retained: 0,
      totalInCohort: cohortUsers.length,
    };
  }

  let retained = 0;

  for (const user of eligibleUsers) {
    const createdTime = new Date(user.createdAt).getTime();

    const windowStart =
      createdTime + activityStartDays * dayInMs;
    const windowEnd = createdTime + activityEndDays * dayInMs;

    const dates =
      activitiesByUser.get(user.id) ?? new Set<string>();

    const hasActivity = Array.from(dates).some((dateStr) => {
      const t = new Date(dateStr).getTime();
      return t >= windowStart && t <= windowEnd;
    });

    if (hasActivity) retained++;
  }

  const rate = (retained / eligibleUsers.length) * 100;

  return {
    rate: Math.round(rate * 10) / 10,
    eligible: eligibleUsers.length,
    retained,
    totalInCohort: cohortUsers.length,
  };
}

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

// Retention stats endpoint - user retention rates based on account creation
app.get("/make-server-f1a393b4/retention-stats", async (c) => {
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

export { app as statsApi };