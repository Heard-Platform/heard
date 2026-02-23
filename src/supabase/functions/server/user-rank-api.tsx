import { Hono } from "npm:hono";
import { getAllRealUsers, getUser } from "./kv-utils.tsx";

const app = new Hono();

app.post("/make-server-f1a393b4/user-rank", async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    const user = await getUser(userId);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
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
      return c.json({ error: "User not found in ranking" }, 404);
    }

    const rank = userIndex + 1;

    return c.json({
      rank,
      totalUsers: sortedUsers.length,
    });
  } catch (error) {
    console.error("Error calculating user rank:", error);
    return c.json({ error: "Failed to calculate rank" }, 500);
  }
});

export { app as userRankApi };
