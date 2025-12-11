import { Hono } from "npm:hono";
import { getDebateRoom, getStatements } from "./debate-api.tsx";

const app = new Hono();

app.get(
  "/make-server-f1a393b4/room/:roomId/analysis",
  async (c: any) => {
    try {
      const roomId = c.req.param("roomId");

      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      const statements = await getStatements(roomId);

      const uniqueParticipants = new Set<string>();
      let totalVotes = 0;

      statements.forEach((statement) => {
        uniqueParticipants.add(statement.author);
        totalVotes +=
          statement.agrees +
          statement.disagrees +
          statement.passes;
      });

      const topPosts = statements
        .map((statement) => {
          const totalVoteCount =
            statement.agrees +
            statement.superAgrees +
            statement.disagrees +
            statement.passes;
          const consensusScore =
            totalVoteCount > 0
              ? ((statement.agrees + statement.superAgrees) /
                  totalVoteCount) *
                100
              : 0;

          return {
            id: statement.id,
            text: statement.text,
            agreeVotes:
              statement.agrees + statement.superAgrees,
            disagreeVotes: statement.disagrees,
            passVotes: statement.passes,
            consensusScore,
          };
        })
        .sort((a, b) => b.consensusScore - a.consensusScore)
        .slice(0, 3);

      return c.json({
        debateTopic: room.topic,
        totalParticipants: uniqueParticipants.size,
        totalStatements: statements.length,
        totalVotes,
        topPosts,
      });
    } catch (error) {
      console.error("Error fetching debate analysis:", error);
      return c.json(
        { error: "Failed to fetch debate analysis" },
        500,
      );
    }
  },
);

export { app as analysisApi };