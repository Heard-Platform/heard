import { getAllRealUsers, getUser } from "./kv-utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { AuthedHono } from "./hono-wrapper.ts";

const authedApp = new AuthedHono();

authedApp.post("/make-server-f1a393b4/user-rank",
  defineRoute(
    {
      userId: { type: "string", required: true },
    },
    async ({ userId }: { userId: string }) => {

    const user = await getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const allUsers = await getAllRealUsers();

    const eligibleUsers =
      allUsers.filter(
        u => !u.isDeveloper && (u.id === userId || !u.isAnonymous)
      ).concat(
        user.isTestUser || user.isDeveloper ? [user] : []
      );
    
    const sortedUsers = eligibleUsers.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    const userIndex = sortedUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error("User not found in eligible users");
    }

    const rank = userIndex + 1;

    return {
      rank,
      totalUsers: sortedUsers.length,
    };
  },
  "Failed to calculate user rank"
));

export { authedApp as userRankApi };
