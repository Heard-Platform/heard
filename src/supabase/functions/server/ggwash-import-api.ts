import { Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { GGWashImporter } from "./ggwash-import-service.ts";

const app = new Hono();

app.post(
  "/make-server-f1a393b4/enrichment/ggwash-import/run",
  defineRoute(
    { dryRun: { type: "boolean", required: false } },
    async (params: { dryRun?: boolean }) => {
      const dryRun = params.dryRun ?? false;
      console.log(`GGWash import triggered (dryRun=${dryRun})`);
      const result = await new GGWashImporter().runOnce(dryRun);
      console.log("GGWash import result:", result);
      return result;
    },
    "Failed to process GGWash import",
  ),
);

export { app as ggwashImportApi };
