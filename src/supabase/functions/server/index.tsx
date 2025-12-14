import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { debateApi } from "./debate-api.tsx";
import { adminApi } from "./admin-api.tsx";
import { authApi } from "./auth-api.tsx";
import { redditApi } from "./reddit-api.tsx";
import { oneTimeFixesApi } from "./one-time-fixes.tsx";
import { feedbackApi } from "./feedback-api.tsx";
import { imageApi } from "./image-api.tsx";
import { activityApi } from "./activity-api.tsx";
import { statsApi } from "./stats-api.tsx";
import { polisImportApi } from "./polis-import-api.tsx";
import { analysisApi } from "./analysis-api.tsx";
import { vineApi } from "./vine-api.tsx";
import { emailPreviewsApi } from "./email-previews.tsx";
import { digestEmailSenderApi } from "./email-digest-sender.tsx";
import { digestEmailOrchestratorApi } from "./email-digest-orchestrator.tsx";

const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Admin-Key",
    ],
    allowMethods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f1a393b4/health", (c) => {
  return c.json({ status: "ok" });
});

// Mount debate API routes
app.route("/", debateApi);

// Mount admin API routes
app.route("/", adminApi);

// Mount auth API routes
app.route("/", authApi);

// Mount reddit API routes
app.route("/", redditApi);

// Mount one-time fixes API routes
app.route("/", oneTimeFixesApi);

// Mount feedback API routes
app.route("/", feedbackApi);

// Mount image API routes
app.route("/", imageApi);

// Mount activity API routes
app.route("/", activityApi);

// Mount stats API routes
app.route("/", statsApi);

// Mount polis import API routes
app.route("/", polisImportApi);

// Mount analysis API routes
app.route("/", analysisApi);

// Mount vine API routes
app.route("/", vineApi);

// Mount email previews API routes
app.route("/", emailPreviewsApi);

// Mount dev digest emails API routes
app.route("/", digestEmailSenderApi);

// Mount digest email orchestrator API routes
app.route("/", digestEmailOrchestratorApi);

Deno.serve(app.fetch);