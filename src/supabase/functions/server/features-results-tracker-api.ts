import { Hono } from "npm:hono";
import { getAllRealUsers } from "./kv-utils.tsx";
import { getUserReports } from "./model-utils.ts";

const app = new Hono();

app.get("/make-server-f1a393b4/stats/features", async (c) => {
  try {
    const users = await getAllRealUsers();
    
    const userReports = (await getUserReports()).length;
    
    const phoneVerifiedUsers = users.filter(
      u => !u.isAnonymous && u.phoneVerified === true
    ).length;
    
    const convertedFromAnonUsers = users.filter(
      u => !u.isAnonymous && u.convertedFromAnonAt
    ).length;
    
    const flyerUsers = users.filter(
      u => u.flyerId
    ).length;
    
    const userReportsSince = new Date("2026-02-04").getTime();
    const phoneVerifiedSince = new Date("2026-01-26").getTime();
    const convertedFromAnonSince = new Date("2026-01-22").getTime();
    const flyerUsersSince = new Date("2026-01-05").getTime();
    
    return c.json({
      userReports,
      userReportsSince,
      phoneVerifiedUsers,
      phoneVerifiedSince,
      convertedFromAnonUsers,
      convertedFromAnonSince,
      flyerUsers,
      flyerUsersSince,
    });
  } catch (error) {
    console.error("Error fetching feature stats:", error);
    return c.json({ error: "Failed to fetch feature stats" }, 500);
  }
});

export { app as featuresResultsTrackerApi };