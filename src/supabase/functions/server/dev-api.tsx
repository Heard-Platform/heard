import { Context, Hono } from "npm:hono";
import {
  getUserSession,
  saveUserAndEmail,
} from "./auth-api.tsx";
import { saveDebateRoom } from "./debate-api.tsx";
import {
  DebateRoom,
  User,
  Statement,
  Vote,
  VoteType,
  CommunityMembership,
} from "./types.tsx";
import { generateId } from "./utils.tsx";
import { API_URL_PREFIX } from "./constants.tsx";
import {
  getAllDebates,
  getAllRealUsers,
  getAllVotes,
  getDebate,
  userKeyFn,
  membershipKeyFn,
  statementKeyFn,
  voteKeyFn,
  parallelBulkUpsert,
} from "./kv-utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { getReferralEventSummary } from "./room-attribution-utils.ts";
import { computeAndGetSessions } from "./session-utils.ts";

const app = new Hono();

app.get("/make-server-f1a393b4/dev/email-previews", async (c) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>What You Missed</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #030213;
          color: #ffffff;
          padding: 32px 24px;
          text-align: center;
        }
        .content {
          padding: 32px 24px;
        }
        .footer {
          padding: 24px;
          text-align: center;
          color: #717182;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">What You Missed</h1>
        </div>
        <div class="content">
          <p>Email content will go here...</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">Heard - Debate App</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return c.html(emailHtml);
});

app.post(
  `${API_URL_PREFIX}/dev/create-anon-enabled-debate`,
  async (c: Context) => {
    try {
      const userId = c.get("userId");

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      const roomId = generateId();
      const anonymousLinkId = generateId();
      
      const debateRoom: DebateRoom = {
        id: roomId,
        topic: "What's the best cat personality?",
        phase: "round1",
        subPhase: "posting",
        gameNumber: 1,
        roundStartTime: Date.now(),
        participants: [userId],
        hostId: userId,
        isActive: true,
        createdAt: Date.now(),
        mode: "realtime",
        rantFirst: true,
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
        allowAnonymous: true,
        anonymousLinkId,
      };

      await saveDebateRoom(debateRoom);

      user.currentRoomId = roomId;
      await saveUserAndEmail(user);

      const invitePath = `/join/${anonymousLinkId}`;

      return c.json({ 
        room: debateRoom, 
        invitePath,
        message: `Anon-enabled debate created! Share: ${invitePath}`,
      });
    } catch (error) {
      console.error("Error creating anonymous debate:", error);
      return c.json(
        { error: "Failed to create anonymous debate" },
        500,
      );
    }
  },
);

app.get(
  `${API_URL_PREFIX}/dev/anon-debates`,
  async (c: Context) => {
    try {
      const allRooms = await getAllDebates();

      const anonDebates = allRooms
        .filter(
          (room) =>
            room.allowAnonymous === true &&
            room.isTestRoom === true
        )
        .map((room) => ({
          ...room,
          invitePath: `/join/${room.anonymousLinkId}`,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      return c.json({ debates: anonDebates });
    } catch (error) {
      console.error("Error fetching anon debates:", error);
      return c.json(
        { error: "Failed to fetch anon debates" },
        500,
      );
    }
  },
);

app.get(
  `${API_URL_PREFIX}/dev/posts`,
  defineRoute(
    {},
    async () => {
      const posts = await getAllDebates();
      
      const sortedPosts = posts
        .sort((a, b) => b.createdAt - a.createdAt)

      return { posts: sortedPosts };
    },
    "Failed to fetch posts"
  )
);

app.get(
  `${API_URL_PREFIX}/dev/flyer-stats`,
  defineRoute(
    {},
    async () => {
      const users = await getAllRealUsers();
      
      const flyerRoomData: Record<string, { topic: string; groups: Record<number, number>; lastUserCreated: number }> = {};
      
      for (const user of users) {
        if (user.flyerId) {
          if (!flyerRoomData[user.flyerId]) {
            const room = await getDebate(user.flyerId);
            flyerRoomData[user.flyerId] = {
              topic: room?.topic || user.flyerId,
              groups: {},
              lastUserCreated: 0
            };
          }
          
          const group = user.flyerGroup || 0;
          if (!flyerRoomData[user.flyerId].groups[group]) {
            flyerRoomData[user.flyerId].groups[group] = 0;
          }
          flyerRoomData[user.flyerId].groups[group]++;
          
          if (user.createdAt && user.createdAt > flyerRoomData[user.flyerId].lastUserCreated) {
            flyerRoomData[user.flyerId].lastUserCreated = user.createdAt;
          }
        }
      }
      
      return { flyerRoomData };
    },
    "Failed to fetch flyer stats"
  )
);

app.get(
  `${API_URL_PREFIX}/dev/referral-events`,
  defineRoute(
    {},
    async () => {
      return await getReferralEventSummary();
    },
    "Failed to fetch referral events"
  )
);

app.get(
  `${API_URL_PREFIX}/dev/sessions`,
  defineRoute(
    {},
    async (_params, c) => {
      const sinceParam = c.req.query("since");
      const sinceTs = sinceParam ? new Date(sinceParam).getTime() : NaN;
      return await computeAndGetSessions(isNaN(sinceTs) ? undefined : sinceTs);
    },
    "Failed to fetch sessions"
  )
);

app.get(
  `${API_URL_PREFIX}/dev/vote-stats`,
  defineRoute(
    {},
    async () => {
      const votes = await getAllVotes();

      const byType: Record<string, number> = {
        agree: 0,
        disagree: 0,
        pass: 0,
        super_agree: 0,
      };

      const votesByUser = new Map<string, number>();

      for (const vote of votes) {
        byType[vote.voteType] = (byType[vote.voteType] || 0) + 1;
        votesByUser.set(vote.userId, (votesByUser.get(vote.userId) || 0) + 1);
      }

      const uniqueVoters = votesByUser.size;
      const avgVotesPerUser =
        uniqueVoters > 0
          ? Math.round((votes.length / uniqueVoters) * 10) / 10
          : 0;

      const distribution: Record<string, number> = {
        "1": 0,
        "2–5": 0,
        "6–10": 0,
        "11–20": 0,
        "21–50": 0,
        "51–100": 0,
        "100+": 0,
      };

      for (const count of votesByUser.values()) {
        if (count === 1) distribution["1"]++;
        else if (count <= 5) distribution["2–5"]++;
        else if (count <= 10) distribution["6–10"]++;
        else if (count <= 20) distribution["11–20"]++;
        else if (count <= 50) distribution["21–50"]++;
        else if (count <= 100) distribution["51–100"]++;
        else distribution["100+"]++;
      }

      return {
        total: votes.length,
        uniqueVoters,
        avgVotesPerUser,
        byType,
        distributionByUser: distribution,
      };
    },
    "Failed to fetch vote stats",
  ),
);

const SAMPLE_STATEMENTS = [
  "The city should invest more in public transit infrastructure",
  "Remote work has permanently changed how we use office space",
  "Bike lanes should replace parking on main streets",
  "Local businesses deserve priority over national chains",
  "Green spaces improve mental health in urban environments",
  "Mixed-use zoning makes neighborhoods more livable",
  "Rent control protects long-term residents from displacement",
  "Solar panels should be required on all new construction",
  "Pedestrian-first street design reduces traffic accidents",
  "Community gardens strengthen neighborhood social bonds",
  "Electric vehicle charging should be publicly funded",
  "Affordable housing quotas should apply to all new developments",
  "Food trucks add vibrancy to urban commercial corridors",
  "Trees on residential streets should be protected by law",
  "Public libraries are essential community infrastructure",
  "Street parking fees should fund public transportation",
  "Noise ordinances should be stricter in residential zones",
  "Farmers markets support local food systems",
  "Urban density reduces per-capita carbon footprint",
  "Historic preservation limits necessary urban growth",
];

const VOTE_DISTRIBUTION: VoteType[] = [
  "agree", "agree", "agree", "agree", "agree",
  "disagree", "disagree", "disagree",
  "pass", "pass",
];

app.post(
  `${API_URL_PREFIX}/dev/scalability-test`,
  async (c: Context) => {
    try {
      const roomId = generateId();
      const now = Date.now();

      const room: DebateRoom = {
        id: roomId,
        topic: "Scalability test room",
        phase: "lobby",
        subPhase: "voting",
        gameNumber: 1,
        roundStartTime: now,
        participants: [],
        hostId: "system",
        isActive: true,
        createdAt: now,
        mode: "realtime",
        subHeard: "test",
        isTestRoom: true,
        endTime: now + 7 * 24 * 60 * 60 * 1000,
      };
      await saveDebateRoom(room);

      const users: User[] = Array.from({ length: 1000 }, (_, i) => ({
        id: generateId(),
        nickname: `TestUser${i + 1}`,
        email: "",
        score: 0,
        streak: 0,
        lastActive: now,
        isTestUser: true,
        isAnonymous: true,
        emailDigestsEnabled: false,
        createdAt: now,
      }));

      const memberships: CommunityMembership[] = users.map((user) => ({
        userId: user.id,
        subHeard: "test",
        joinedAt: now,
      }));

      await parallelBulkUpsert(users, userKeyFn);
      await parallelBulkUpsert(memberships, (m: CommunityMembership) =>
        membershipKeyFn(m.userId, m.subHeard)
      );

      const statements: Statement[] = [];
      const userOwnedStatementIds = new Map<string, Set<string>>();

      for (const user of users) {
        const count = Math.floor(Math.random() * 4);
        const ownIds = new Set<string>();
        for (let i = 0; i < count; i++) {
          const statementId = generateId();
          const text = SAMPLE_STATEMENTS[
            Math.floor(Math.random() * SAMPLE_STATEMENTS.length)
          ];
          statements.push({
            id: statementId,
            text,
            author: user.id,
            agrees: 0,
            disagrees: 0,
            passes: 0,
            superAgrees: 0,
            roomId,
            timestamp: now + Math.floor(Math.random() * 3_600_000),
            round: 1,
            voters: {},
          });
          ownIds.add(statementId);
        }
        userOwnedStatementIds.set(user.id, ownIds);
      }

      const statementById = new Map(statements.map((s) => [s.id, s]));
      const allStatementIds = statements.map((s) => s.id);

      const votes: Vote[] = [];

      for (const user of users) {
        const voteCount = 20 + Math.floor(Math.random() * 21);
        const ownIds = userOwnedStatementIds.get(user.id) ?? new Set();
        const eligible = allStatementIds.filter((id) => !ownIds.has(id));
        const shuffled = eligible
          .map((id) => [Math.random(), id] as [number, string])
          .sort((a, b) => a[0] - b[0])
          .map(([, id]) => id)
          .slice(0, Math.min(voteCount, eligible.length));

        for (const statementId of shuffled) {
          const voteType =
            VOTE_DISTRIBUTION[
              Math.floor(Math.random() * VOTE_DISTRIBUTION.length)
            ];
          votes.push({
            id: generateId(),
            statementId,
            userId: user.id,
            voteType,
            timestamp: now,
          });
          const stmt = statementById.get(statementId)!;
          if (voteType === "agree") stmt.agrees++;
          else if (voteType === "disagree") stmt.disagrees++;
          else if (voteType === "pass") stmt.passes++;
          else if (voteType === "super_agree") stmt.superAgrees++;
          stmt.voters[user.id] = voteType;
        }
      }

      await parallelBulkUpsert(statements, statementKeyFn);
      await parallelBulkUpsert(votes, voteKeyFn);

      return c.json({
        success: true,
        roomId,
        userCount: users.length,
        statementCount: statements.length,
        voteCount: votes.length,
        message: `Created ${statements.length} statements and ${votes.length} votes across ${users.length} users`,
      });
    } catch (error) {
      console.error("Error running scalability test:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  },
);

export { app as devApi };