import { Hono } from "npm:hono";
import { getDebateRoom, getStatements } from "./debate-api.tsx";
import {
  ClusterAssignment,
  ClusterMetadata,
  recalculateClustersForRoom,
} from "./clustering.tsx";
import { calculateClusterConsensus } from "./cluster-analysis.tsx";
import { getParsedKvData } from "./kv-utils.tsx";
import { calculateAnalysisMetrics, computeTopPosts, getStatementVoterIds } from "./analysis-utils.tsx";
import { applyStatementMerges } from "./room-utils.ts";
import { AnalysisData } from "./types.tsx";
import {
  getDemographicAnswersForQuestionIds,
  getDemographicQuestionsForRoom,
  getMergesForRoom,
  getStatementTagLinksForRoom,
  getStatementTagsForRoom,
} from "./model-utils.ts";
import { defineRoute } from "./route-wrapper.tsx";

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

      const [statements, merges] = await Promise.all([
        getStatements(roomId),
        getMergesForRoom(roomId),
      ]);
      const mergedStatements = applyStatementMerges(statements, merges);

      const questions = await getDemographicQuestionsForRoom(roomId);
      const questionIds = questions.map((q) => q.id);
      const answers = await getDemographicAnswersForQuestionIds(questionIds);

      const metrics = calculateAnalysisMetrics(mergedStatements, questions, answers);

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

      const voterIds = getStatementVoterIds(mergedStatements);
      if (
        clusterMetadata &&
        voterIds.length > 0
      ) {
        const assignments = await Promise.all(
          voterIds.map((userId) =>
            getParsedKvData<ClusterAssignment>(
              `cluster_assignment:${roomId}:${userId}`,
            ),
          ),
        );

        clusterConsensus = calculateClusterConsensus(
          mergedStatements,
          clusterMetadata,
          assignments,
          voterIds,
        );
      }

      const allStatementsWithClusters = clusterConsensus
        ? metrics.allStatements.map((s) => ({
            ...s,
            clusterVotes: clusterConsensus.statementBreakdowns[s.id] ?? [],
          }))
        : metrics.allStatements;

      const tagNames = (c.req.query("tags") ?? "")
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);

      let topPosts = {
        topAgreedPosts: metrics.topAgreedPosts,
        topDisagreedPosts: metrics.topDisagreedPosts,
        spiciestPosts: metrics.spiciestPosts,
      };

      if (tagNames.length > 0) {
        const [roomTags, roomTagLinks] = await Promise.all([
          getStatementTagsForRoom(roomId),
          getStatementTagLinksForRoom(roomId),
        ]);
        const matchingTagIds = new Set(
          roomTags.filter((t) => tagNames.includes(t.name)).map((t) => t.id),
        );
        const taggedStatementIds = new Set(
          roomTagLinks.filter((l) => matchingTagIds.has(l.tagId)).map((l) => l.statementId),
        );
        const taggedStatements = mergedStatements.filter((s) => taggedStatementIds.has(s.id));
        topPosts = computeTopPosts(taggedStatements);
      }

      const analysisData: AnalysisData = {
        debateTopic: room.topic,
        totalStatements: mergedStatements.length,
        clusterConsensus,
        ...metrics,
        ...topPosts,
        allStatements: allStatementsWithClusters,
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

app.get(
  "/make-server-f1a393b4/room/:roomId/statement-tags",
  defineRoute(
    {},
    async (_params, c) => {
      const roomId = c.req.param("roomId") as string;
      const [tags, links] = await Promise.all([
        getStatementTagsForRoom(roomId),
        getStatementTagLinksForRoom(roomId),
      ]);
      return { tags, links };
    },
    "Failed to fetch statement tags",
  ),
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