import { Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { GGWashImporter } from "./ggwash-import-service.ts";

const app = new Hono();

app.post(
  "/make-server-f1a393b4/enrichment/ggwash-import/run",
  defineRoute(
    {},
    async () => {
      console.log("GGWash import cron job triggered");
      const result = await new GGWashImporter().runOnce();
      console.log("GGWash import result:", result);
      return result;
    },
    "Failed to process GGWash import cron job",
  ),
);

export { app as ggwashImportApi };
