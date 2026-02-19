import { Hono } from "npm:hono";
import type { DebateRoom, Statement } from "./types.tsx";
import { generateId, saveDebateRoom } from "./debate-api.tsx";
import { getEnrichmentConfig } from "./internal-config-api.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { getCommunity, saveCommunity, saveStatement } from "./kv-utils.tsx";
import { validateCronAuth } from "./cron-api.tsx";
import { RedditImporter } from "./reddit-import-service.ts";

const app = new Hono();

async function ensureTestCommunityExists() {
  const testCommunity = await getCommunity("test");
  if (!testCommunity) {
    await saveCommunity({
      name: "test",
      isPrivate: false,
      adminId: "system",
      hostOnlyPosting: false,
    });
  }
}

app.post(
  "/make-server-f1a393b4/enrichment/run",
  validateCronAuth,
  defineRoute(
    { forceRun: { type: 'boolean', required: false } },
    async (params: { forceRun?: boolean }) => {
      console.log("Enrich feed cron job triggered");

      const config = await getEnrichmentConfig();
      
      if (!config.enabled && !params.forceRun) {
        console.log("Enrichment service is disabled");
        return { 
          skipped: true,
          message: "Enrichment service is disabled"
        };
      }

      if (!params.forceRun) {
        const probability = 1 / config.averageIntervalMins;
        const randomValue = Math.random();
        
        if (randomValue >= probability) {
          console.log(`Skipping this run (random: ${randomValue.toFixed(3)}, probability: ${probability})`);
          return { 
            skipped: true,
            message: "Skipped based on probability",
            probability,
            randomValue
          };
        }

        console.log(`Proceeding with enrichment (random: ${randomValue.toFixed(3)}, probability: ${probability})`);
      } else {
        console.log("Force run enabled, bypassing probability check");
      }

      const redditImporter = new RedditImporter();
      await redditImporter.runOnce();

      return { 
        message: "Successfully created mock debate post",
        forceRun: params.forceRun || false,
      };
    },
    "Failed to process enrich feed cron job"
  ),
);

export { app as enrichmentApi };