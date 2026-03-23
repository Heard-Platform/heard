import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { debateApi } from "./debate-api.tsx";
import { adminApi } from "./admin-api.tsx";
import { authApi } from "./auth-api.tsx";
import { redditApi } from "./reddit-import-api.ts";
import { oneTimeFixesApi } from "./one-time-fixes.tsx";
import { feedbackApi } from "./feedback-api.tsx";
import { imageApi } from "./image-api.tsx";
import { activityApi } from "./activity-api.tsx";
import { statsApi } from "./stats-api.tsx";
import { featuresResultsTrackerApi } from "./features-results-tracker-api.ts";
import { polisImportApi } from "./polis-import-api.tsx";
import { analysisApi } from "./analysis-api.tsx";
import { vineApi } from "./vine-api.tsx";
import { emailPreviewsApi } from "./email-previews.tsx";
import { digestEmailOrchestratorApi } from "./email-digest-orchestrator.tsx";
import { unsubscribeApi } from "./unsubscribe.tsx";
import { devApi } from "./dev-api.tsx";
import { flyerApi } from "./flyer-api.tsx";
import { validateSessionId } from "./auth-api.tsx";
import { loginApi } from "./auth-login-api.ts";
import { cronApi } from "./cron-api.tsx";
import { reportingApi } from "./reporting-api.tsx";
import { internalConfigApi } from "./internal-config-api.tsx";
import { enrichmentApi } from "./enrichment-api.ts";
import { userRankApi } from "./user-rank-api.tsx";
import { accountApi } from "./account-api.ts";

type Variables = {
  userId?: string;
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Admin-Key",
      "X-Session-Id",
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

app.use("*", async (c, next) => {
  const sessionId = c.req.header("X-Session-Id");
  
  if (sessionId) {
    const validation = await validateSessionId(sessionId);
    
    if (!validation.valid) {
      return c.json({ error: validation.error || "Invalid session" }, 401);
    }
    
    c.set("userId", validation.userId);
  }
  
  await next();
});

app.get("/make-server-f1a393b4/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/", debateApi);
app.route("/", adminApi);
app.route("/", authApi);
app.route("/", accountApi);
app.route("/", loginApi);
app.route("/", redditApi);
app.route("/", oneTimeFixesApi);
app.route("/", feedbackApi);
app.route("/", imageApi);
app.route("/", activityApi);
app.route("/", statsApi);
app.route("/", featuresResultsTrackerApi);
app.route("/", polisImportApi);
app.route("/", analysisApi);
app.route("/", vineApi);
app.route("/", emailPreviewsApi);
app.route("/", digestEmailOrchestratorApi);
app.route("/", unsubscribeApi);
app.route("/", devApi);
app.route("/", flyerApi);
app.route("/", cronApi);
app.route("/", reportingApi);
app.route("/", internalConfigApi);
app.route("/", enrichmentApi);
app.route("/", userRankApi);

Deno.serve(app.fetch);