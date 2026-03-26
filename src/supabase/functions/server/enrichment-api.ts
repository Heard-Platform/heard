import { Hono } from "npm:hono";
import { getEnrichmentConfig } from "./internal-config-api.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { RedditImporter } from "./reddit-import-service.ts";

const app = new Hono();

app.post(
  "/make-server-f1a393b4/enrichment/run",
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
        const now = new Date();
        const hour = now.getUTCHours() - 4;
        const ET_CUTOFF_HOUR_START = 3;
        const ET_CUTOFF_HOUR_END = 7;
        if (hour >= ET_CUTOFF_HOUR_START && hour < ET_CUTOFF_HOUR_END) {
          console.log(`Skipping enrichment between 3am and 7am ET (current hour: ${hour})`);
          return { 
            skipped: true,
            message: "Skipped due to time window restrictions"
          };
        }

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