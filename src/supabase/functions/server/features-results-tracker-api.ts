import { Hono } from "npm:hono";
import { getAllRealUsers } from "./kv-utils.tsx";
import { getUserReports, getFlyerEmails } from "./model-utils.ts";

const app = new Hono();

app.get("/make-server-f1a393b4/stats/features", async (c) => {
  try {
    const users = await getAllRealUsers();
    
    const webDriverUsers = users.filter(
      u => u.webdriver === true
    ).length;

    const uniqueIpAddresses = new Set(
      users
        .map(u => u.ipAddress)
        .filter(ip => ip && ip !== "unknown")
    ).size;
    
    const uniqueFingerprints = new Set(
      users
        .map(u => u.fingerprint)
        .filter(fp => fp && fp !== "unknown")
    ).size;
    
    const uniqueUserAgents = new Set(
      users
        .map(u => u.userAgent)
        .filter(ua => ua && ua !== "unknown")
    ).size;
    
    const tosAgreedUsers = users.filter(
      u => u.tosAgreedToAt
    ).length;
    
    const privacyPolicyAgreedUsers = users.filter(
      u => u.privacyPolicyAgreedToAt
    ).length;
    
    const flyerEmails = (await getFlyerEmails()).length;
    
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

    const avatarAnimalUsers = users.filter(
      u => u.avatarAnimal
    ).length;

    const avatarAnimalCounts: Record<string, number> = {};
    for (const u of users) {
      if (u.avatarAnimal) {
        const currentCount = avatarAnimalCounts[u.avatarAnimal] ?? 0;
        avatarAnimalCounts[u.avatarAnimal] = currentCount + 1;
      }
    }

    const avatarAnimalData = { counts: avatarAnimalCounts };

    const webDriverUsersSince = new Date("2026-03-03").getTime();
    const uniqueIpAddressesSince = new Date("2026-03-03").getTime();
    const uniqueFingerprintsSince = new Date("2026-03-03").getTime();
    const uniqueUserAgentsSince = new Date("2026-03-03").getTime();
    const tosAgreedSince = new Date("2026-02-25").getTime();
    const privacyPolicyAgreedSince = new Date("2026-03-03").getTime();
    const flyerEmailsSince = new Date("2026-02-11").getTime();
    const userReportsSince = new Date("2026-02-04").getTime();
    const phoneVerifiedSince = new Date("2026-01-26").getTime();
    const convertedFromAnonSince = new Date("2026-01-22").getTime();
    const flyerUsersSince = new Date("2026-01-05").getTime();
    const avatarAnimalUsersSince = new Date("2026-03-26").getTime();
    
    return c.json({
      webDriverUsers,
      webDriverUsersSince,
      uniqueIpAddresses,
      uniqueIpAddressesSince,
      uniqueFingerprints,
      uniqueFingerprintsSince,
      uniqueUserAgents,
      uniqueUserAgentsSince,
      tosAgreedUsers,
      tosAgreedSince,
      privacyPolicyAgreedUsers,
      privacyPolicyAgreedSince,
      flyerEmails,
      flyerEmailsSince,
      userReports,
      userReportsSince,
      phoneVerifiedUsers,
      phoneVerifiedSince,
      convertedFromAnonUsers,
      convertedFromAnonSince,
      flyerUsers,
      flyerUsersSince,
      avatarAnimalUsers,
      avatarAnimalUsersSince,
      avatarAnimalData,
    });
  } catch (error) {
    console.error("Error fetching feature stats:", error);
    return c.json({ error: "Failed to fetch feature stats" }, 500);
  }
});

export { app as featuresResultsTrackerApi };