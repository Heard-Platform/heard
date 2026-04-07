import { Hono } from "npm:hono";
import { getDebateRoom, getStatements } from "./debate-api.tsx";
import {
  ClusterAssignment,
  ClusterMetadata,
  recalculateClustersForRoom,
} from "./clustering.tsx";
import { calculateClusterConsensus } from "./cluster-analysis.tsx";
import { getParsedKvData } from "./kv-utils.tsx";
import { calculateAnalysisMetrics } from "./analysis-utils.tsx";
import { AnalysisData } from "./types.tsx";

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

      const metrics = calculateAnalysisMetrics(statements);

      const metadataKey = `cluster:${roomId}:metadata`;
      let clusterMetadata =
        await getParsedKvData<ClusterMetadata>(metadataKey);

      if (
        !clusterMetadata &&
        room.participants.length > 0 &&
        statements.length > 0
      ) {
        console.log(
          `[Analysis] No cluster data found for room ${roomId}, generating now...`,
        );
        clusterMetadata =
          await recalculateClustersForRoom(roomId);
      } else if (clusterMetadata) {
        const lastClusterVoteCount =
          clusterMetadata.totalVotes ?? null;
        if (
          lastClusterVoteCount === null ||
          metrics.totalVotes > lastClusterVoteCount
        ) {
          console.log(
            `[Analysis] ${lastClusterVoteCount === null ? "Legacy cluster data" : `New votes detected`} for room ${roomId} (${metrics.totalVotes} vs ${lastClusterVoteCount}), recalculating clusters...`,
          );
          clusterMetadata =
            await recalculateClustersForRoom(roomId);
        } else {
          console.log(
            `[Analysis] Using cached cluster data for room ${roomId} (${metrics.totalVotes} votes)`,
          );
        }
      }

      let clusterConsensus = null;

      if (
        clusterMetadata &&
        room.participants &&
        room.participants.length > 0
      ) {
        const assignments = await Promise.all(
          room.participants.map((userId) =>
            getParsedKvData<ClusterAssignment>(
              `cluster_assignment:${roomId}:${userId}`,
            ),
          ),
        );

        clusterConsensus = calculateClusterConsensus(
          statements,
          clusterMetadata,
          assignments,
          room.participants,
        );
      }

      const analysisData: AnalysisData = {
        debateTopic: room.topic,
        totalStatements: statements.length,
        clusterConsensus,
        ...metrics,
      };
      
      return c.json(analysisData);
    } catch (error) {
      console.error("Error fetching debate analysis:", error);
      return c.json(
        { error: "Failed to fetch debate analysis" },
        500,
      );
    }
  },
);

app.post(
  "/make-server-f1a393b4/room/:roomId/regenerate-clusters",
  async (c: any) => {
    try {
      const roomId = c.req.param("roomId");

      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      console.log(`[RegenerateClusters] Regenerating clusters for room ${roomId}...`);
      
      const clusterMetadata = await recalculateClustersForRoom(roomId);

      if (!clusterMetadata) {
        return c.json({ error: "Failed to regenerate clusters" }, 500);
      }

      console.log(`[RegenerateClusters] Successfully regenerated clusters for room ${roomId}`);
      
      return c.json({ 
        success: true,
        totalClusters: clusterMetadata.totalClusters 
      });
    } catch (error) {
      console.error("Error regenerating clusters:", error);
      return c.json(
        { error: `Failed to regenerate clusters: ${error instanceof Error ? error.message : "Unknown error"}` },
        500,
      );
    }
  },
);

export { app as analysisApi };