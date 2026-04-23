// @ts-ignore
import { Hono } from "npm:hono";
import { getAllVotes } from "./kv-utils.tsx";
import type { Vote } from "./types.tsx";
import { upsert, selectAll } from "./db-utils.ts";
import { defineRoute } from "./route-wrapper.tsx";

const app = new Hono();

app.post(
  "/make-server-f1a393b4/one-time-fixes/copy-votes-to-table",
  defineRoute(
    { dryRun: { type: "boolean", required: true } },
    async ({ dryRun }: { dryRun: boolean }) => {
      const kvVotes = await getAllVotes();
      console.log(`Found ${kvVotes.length} votes in KV store (dryRun=${dryRun})`);

      if (dryRun) {
        const tableVoteCount = (await selectAll("votes")).length;
        return {
          dryRun: true,
          kvVoteCount: kvVotes.length,
          tableVoteCount,
          message: `Dry run: ${kvVotes.length} votes in KV store, ${tableVoteCount} already in table. ${kvVotes.length - tableVoteCount} would be inserted.`,
        };
      }

      const seen = new Set<string>();
      const rows = kvVotes.reduce<typeof kvVotes>((acc, vote) => {
        if (!seen.has(vote.id)) {
          seen.add(vote.id);
          acc.push(vote);
        }
        return acc;
      }, []).map((vote: Vote) => ({
        id: vote.id,
        statementId: vote.statementId,
        userId: vote.userId,
        voteType: vote.voteType,
        timestamp: Math.floor(vote.timestamp),
        flyerId: vote.flyerId ?? null,
        anonymousUserId: vote.anonymousUserId ?? null,
      }));

      const batchSize = 500;
      let inserted = 0;
      const batchErrors: string[] = [];

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const result = await upsert("votes", batch as any, "id");
        if (!result.success) {
          batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${result.error}`);
        } else {
          inserted += batch.length;
        }
      }

      // Quality check: compare deduplicated KV count to table count
      const tableVoteCount = (await selectAll("votes")).length;
      const countsMatch = tableVoteCount === rows.length;

      return {
        dryRun: false,
        kvVoteCount: kvVotes.length,
        uniqueKvVoteCount: rows.length,
        insertedCount: inserted,
        tableVoteCount,
        countsMatch,
        batchErrors,
        message: countsMatch
          ? `Successfully copied ${inserted} votes. KV and table counts match (${tableVoteCount}).`
          : `Inserted ${inserted} votes but counts differ — KV: ${kvVotes.length}, table: ${tableVoteCount}. Check batchErrors.`,
      };
    },
    "Failed to copy votes to table",
  ),
);

export { app as backfillVotesToTableApi };
