// @ts-ignore
import { Hono } from "npm:hono";
import { getAllDebates, getAllRealUsers, getMembership, saveMembership } from "./kv-utils.tsx";
import { verifyAdminKey } from "./admin-api.tsx";

const app = new Hono();

app.use("/make-server-f1a393b4/one-time-fixes/backfill-community-memberships", verifyAdminKey);

app.post(
  "/make-server-f1a393b4/one-time-fixes/backfill-community-memberships",
  async (c) => {
    try {
      const { dryRun } = await c.req.json();
      
      console.log(`[Backfill Memberships] Starting ${dryRun ? 'DRY RUN' : 'LIVE RUN'}`);
      
      const allUsers = await getAllRealUsers();
      const nonAnonUsers = allUsers.filter(user => !user.isAnonymous);
      
      console.log(`[Backfill Memberships] Processing ${nonAnonUsers.length} non-anonymous users`);
      
      const allRooms = await getAllDebates();
      
      const userToSubHeards = new Map<string, Set<string>>();
      
      for (const room of allRooms) {
        if (!room.subHeard || !room.participants || room.participants.length === 0) {
          continue;
        }
        
        for (const participantId of room.participants) {
          const user = nonAnonUsers.find(u => u.id === participantId);
          if (!user) {
            continue;
          }
          
          if (!userToSubHeards.has(participantId)) {
            userToSubHeards.set(participantId, new Set());
          }
          userToSubHeards.get(participantId)!.add(room.subHeard);
        }
      }
      
      let totalMembershipsToCreate = 0;
      let totalMembershipsAlreadyExist = 0;
      let usersNeedingMemberships = 0;
      
      for (const [userId, subHeardsSet] of userToSubHeards.entries()) {
        let userNeedsMemberships = false;
        
        for (const subHeard of subHeardsSet) {
          const membershipKey = `subheard_member:${userId}:${subHeard}`;
          const existingMembership = await getMembership(userId, subHeard);
          
          if (existingMembership) {
            totalMembershipsAlreadyExist++;
          } else {
            totalMembershipsToCreate++;
            userNeedsMemberships = true;
            
            if (!dryRun) {
              const membershipData = {
                userId,
                subHeard,
                joinedAt: Date.now(),
              };
              await saveMembership(membershipData);
              console.log(`Created membership: ${userId} -> ${subHeard}`);
            }
          }
        }
        
        if (userNeedsMemberships) {
          usersNeedingMemberships++;
        }
      }
      
      const summary = {
        totalUsers: nonAnonUsers.length,
        usersNeedingMemberships,
        totalMembershipsToCreate,
        totalMembershipsAlreadyExist,
        dryRun,
      };
      
      console.log(`[Backfill Memberships] Summary:`, summary);
      
      return c.json({
        ...summary,
        success: true,
        message: dryRun 
          ? `Dry run complete: ${usersNeedingMemberships} users need ${totalMembershipsToCreate} memberships created`
          : `Created ${totalMembershipsToCreate} memberships for ${usersNeedingMemberships} users`,
      });
    } catch (error) {
      console.error("Error backfilling community memberships:", error);
      return c.json(
        { error: `Failed to backfill community memberships: ${error}` },
        500,
      );
    }
  },
);

export { app as backfillMembershipsApi };