import { Hono } from "npm:hono";
import {
  getAllSubHeards, getActivitiesForDate,
  getAllRealUsers,
  getAllRealDebates,
  getAllStatements,
  getAllVotes,
  getAllAskTheDataRecords,
} from "./kv-utils.tsx";
import { getAllRecords, selectAll } from "./db-utils.ts";
import type { Session, UserEvent } from "./types.tsx";
import { getEventsOfType, getFlyerEmails, getUserReports } from "./model-utils.ts";
import { generateSparklineData, getDateString, calculateRetention, buildActiveDaysMap } from "./stats-utils.ts";
import { buildCohortFunnelData } from "./cohort-utils.ts";
import { buildUserRetentionTable } from "./retention-utils.ts";
import { defineRoute } from "./route-wrapper.tsx";

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

    const [allVotes, allStatements] = await Promise.all([
      getAllVotes(),
      getAllStatements(),
    ]);

    const actionDatesByUser = new Map<string, Set<string>>();
    const recordActionDate = (userId: string, timestamp: number) => {
      const date = new Date(timestamp).toISOString().split("T")[0];
      let dates = actionDatesByUser.get(userId);
      if (!dates) {
        dates = new Set();
        actionDatesByUser.set(userId, dates);
      }
      dates.add(date);
    };
    for (const vote of allVotes) {
      recordActionDate(vote.userId, vote.timestamp);
    }
    for (const statement of allStatements) {
      recordActionDate(statement.author, statement.timestamp);
    }

    let usersWhoTookAction = []
    let usersWhoTookActionTwoDays = [];
    let usersWhoTookActionTenDays = [];

    for (const user of usersWithAccounts) {
      const uniqueDateCount = actionDatesByUser.get(user.id)?.size ?? 0;

      if (uniqueDateCount >= 1) {
        usersWhoTookAction.push(user.id);
      }
      if (uniqueDateCount >= 2) {
        usersWhoTookActionTwoDays.push(user.id);
      }
      if (uniqueDateCount >= 10) {
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


app.get(
  "/make-server-f1a393b4/stats/cohort-funnel",
  defineRoute(
    {},
    async () => {
      const [allUsers, allVotes, allStatements, allRooms] = await Promise.all([
        getAllRealUsers(),
        getAllVotes(),
        getAllStatements(),
        getAllRealDebates(),
      ]);

      const nonDevUsers = allUsers.filter(user => !user.isDeveloper);
      return buildCohortFunnelData(nonDevUsers, allVotes, allStatements, allRooms);
    },
    "Failed to calculate cohort funnel data",
  ),
);

app.get(
  "/make-server-f1a393b4/stats/user-retention-table",
  defineRoute(
    {},
    async () => {
      const [allUsers, allVotes, allStatements, allRooms] = await Promise.all([
        getAllRealUsers(),
        getAllVotes(),
        getAllStatements(),
        getAllRealDebates(),
      ]);

      const nonDevUsers = allUsers.filter(user => !user.isDeveloper);
      const users = buildUserRetentionTable(nonDevUsers, allVotes, allStatements, allRooms);
      return { users };
    },
    "Failed to build user retention table",
  ),
);

app.get(
  "/make-server-f1a393b4/stats/activity-feed",
  defineRoute(
    {},
    async () => {
      const now = Date.now();
      const since = now - 7 * 24 * 60 * 60 * 1000;

      const [
        users,
        rooms,
        statements,
        votes,
        subHeards,
        sessions,
        modInviteAccepts,
        cohostEvents,
        askTheDataRecords,
        userReports,
        pageLoadEvents,
      ] = await Promise.all([
        getAllRealUsers(),
        getAllRealDebates(),
        getAllStatements(),
        getAllVotes(),
        getAllSubHeards(),
        getAllRecords<Session>("session:"),
        getEventsOfType("mod_invite_accepted"),
        selectAll<UserEvent>("user_events", {
          type: "cohost_invite_accepted",
        }),
        getAllAskTheDataRecords(),
        getUserReports(),
        selectAll<UserEvent>("user_events", { type: "initial_load" }),
      ]);

      type FeedEvent = {
        type:
          | "user"
          | "room"
          | "statement"
          | "vote"
          | "community"
          | "session"
          | "cohost"
          | "modInviteAccept"
          | "askTheData"
          | "userReport"
          | "pageLoad";
        timestamp: number;
        id: string;
        label: string;
        meta?: Record<string, string>;
      };

      const ts = (val: number | string | undefined): number => {
        if (!val) return 0;
        const n = Number(val);
        return isNaN(n) ? new Date(val).getTime() : n;
      };

      const statementMap = new Map(statements.map((s: any) => [s.id, s]));
      const roomMap = new Map(rooms.map((r: any) => [r.id, r]));

      const events: FeedEvent[] = [];

      for (const user of users) {
        const t = ts(user.createdAt);
        if (t > since) {
          events.push({ type: "user", timestamp: t, id: user.id, label: user.nickname || user.email || user.id.substring(0, 8) });
        }
      }

      for (const room of rooms) {
        const t = ts(room.createdAt);
        if (t > since) {
          events.push({ type: "room", timestamp: t, id: room.id, label: room.topic || room.id });
        }
      }

      for (const statement of statements) {
        const t = ts(statement.timestamp);
        if (t > since) {
          const roomTopic = (roomMap.get(statement.roomId) as any)?.topic;
          events.push({
            type: "statement",
            timestamp: t,
            id: statement.id,
            label: statement.text.length > 80 ? statement.text.substring(0, 80) + "…" : statement.text,
            meta: { room: roomTopic || statement.roomId },
          });
        }
      }

      for (const vote of votes) {
        const t = ts(vote.timestamp);
        if (t > since) {
          const stmtText = (statementMap.get(vote.statementId) as any)
            ?.text;
          events.push({
            type: "vote",
            timestamp: t,
            id: vote.id,
            label: vote.voteType,
            meta: {
              statement: stmtText
                ? stmtText.length > 60
                  ? stmtText.substring(0, 60) + "…"
                  : stmtText
                : vote.statementId,
            },
          });
        }
      }

      for (const subHeard of subHeards) {
        const t = ts(subHeard.createdAt);
        if (t > since) {
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
        if (t > since) {
          events.push({
            type: "session",
            timestamp: t,
            id: session.id,
            label: session.userId.substring(0, 8),
          });
        }
      }

      for (const event of modInviteAccepts) {
        const t = ts(event.createdAt);
        if (t > since) {
          events.push({
            type: "modInviteAccept",
            timestamp: t,
            id: `${event.userId}-${event.roomId}-${t}`,
            label: `Mod invite accepted`,
            meta: { community: event.roomId ?? "", user: (event.userId ?? "").substring(0, 8) },
          });
        }
      }

      for (const event of cohostEvents) {
        const t = ts(event.createdAt);
        if (t > since) {
          const roomTopic = event.roomId ? (roomMap.get(event.roomId) as any)?.topic : undefined;
          events.push({
            type: "cohost",
            timestamp: t,
            id: event.userId ?? event.roomId ?? String(t),
            label: "Co-host accepted",
            meta: { room: roomTopic || event.roomId || "" },
          })
        }
      }

      for (const record of askTheDataRecords) {
        const t = ts(record.createdAt);
        if (t > since) {
          const roomTopic = (roomMap.get(record.roomId) as any)?.topic;
          events.push({
            type: "askTheData",
            timestamp: t,
            id: record.id,
            label: record.question.length > 80 ? record.question.substring(0, 80) + "…" : record.question,
            meta: { room: roomTopic || record.roomId, answer: record.answer.length > 80 ? record.answer.substring(0, 80) + "…" : record.answer },
          });
        }
      }

      for (const report of userReports) {
        const t = ts(report.createdAt);
        if (t > since) {
          events.push({
            type: "userReport",
            timestamp: t,
            id: report.id,
            label: "Response flagged",
            meta: {
              responseId: report.responseId,
              ...(report.reason ? { reason: report.reason } : {}),
            },
          });
        }
      }

      for (const event of pageLoadEvents) {
        const t = ts(event.createdAt);
        if (t > since) {
          events.push({
            type: "pageLoad",
            timestamp: t,
            id: `${event.userId ?? "anon"}-${t}`,
            label: "Page load",
            meta: event.url ? { url: event.url } : undefined,
          });
        }
      }

      events.sort((a, b) => b.timestamp - a.timestamp);

      const ALL_FEED_TYPES = [
        "user", "session", "room", "community", "statement",
        "vote", "modInviteAccept", "cohost", "askTheData", "userReport", "pageLoad",
      ];
      const toDateKey = (t: number) => new Date(t).toISOString().split("T")[0];
      const dayCounts = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now - (6 - i) * 86_400_000);
        const dayKey = toDateKey(d.getTime());
        const point: Record<string, number | string> = {
          day: `${d.getMonth() + 1}/${d.getDate()}`,
        };
        for (const t of ALL_FEED_TYPES) {
          point[t] = events.filter(
            (e) => e.type === t && toDateKey(e.timestamp) === dayKey,
          ).length;
        }
        return point;
      });

      return { events: events.slice(0, 500), dayCounts, fetchedAt: now };
    },
    "Failed to fetch activity feed",
  ),
);

app.get("/make-server-f1a393b4/stats/user-timeline", async (c) => {
  try {
    const [users, allVotes, allStatements] = await Promise.all([
      getAllRealUsers(),
      getAllVotes(),
      getAllStatements(),
    ]);

    const activeDaysByUser = buildActiveDaysMap(allVotes, allStatements);

    const entries = users
      .filter((u: any) => {
        const startDay = new Date(u.createdAt).toISOString().split("T")[0];
        const endDay = new Date(u.lastActive).toISOString().split("T")[0];
        return startDay !== endDay;
      })
      .map((u: any) => ({
        id: u.id,
        nickname: u.nickname,
        email: u.email,
        createdAt: u.createdAt,
        lastActive: u.lastActive,
        isTestUser: u.isTestUser,
        isDeveloper: u.isDeveloper,
        activeDays: Array.from(activeDaysByUser.get(u.id) ?? []).sort((a: number, b: number) => a - b),
      }));

    return c.json({ entries });
  } catch (error) {
    console.error("Error fetching user timeline:", error);
    return c.json({ error: "Failed to fetch user timeline" }, 500);
  }
});

export { app as statsApi };