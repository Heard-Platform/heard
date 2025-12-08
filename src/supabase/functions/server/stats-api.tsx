import { Hono } from "npm:hono@4";
import * as kv from "./kv_store.tsx";
import {
  getAllUsers,
  getActivitiesForDate,
} from "./kv-utils.tsx";
import { UserSession } from "./auth-api.tsx";

const app = new Hono();

const generateSparklineData = (items: any[], daysBack = 7) => {
  const now = Date.now();
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
  allUsers: UserSession[];
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
    return { rate: 0, eligible: 0, retained: 0, totalInCohort: cohortUsers.length };
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
    const userKeys = await kv.getByPrefix("user:");
    const totalUsers = userKeys.length;
    const usersSparkline = generateSparklineData(userKeys, 7);

    const subHeardKeys = await kv.getByPrefix("subheard:");
    const totalSubHeards = subHeardKeys.length;
    const subHeardsSparkline = generateSparklineData(
      subHeardKeys,
      7,
    );

    const debateKeys = await kv.getByPrefix("room:");
    const totalDebates = debateKeys.length;
    const debatesSparkline = generateSparklineData(
      debateKeys,
      7,
    );

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
    const allUsers = await getAllUsers();
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

export { app as statsApi };