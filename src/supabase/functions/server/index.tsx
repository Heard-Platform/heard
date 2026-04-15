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
import { orgsApi } from "./orgs-api.tsx";
import { validateSessionId } from "./auth-api.tsx";
import { loginApi } from "./auth-login-api.ts";
import { cronApi } from "./cron-api.tsx";
import { reportingApi } from "./reporting-api.tsx";
import { internalConfigApi } from "./internal-config-api.tsx";
import { enrichmentApi } from "./enrichment-api.ts";
import { userRankApi } from "./user-rank-api.tsx";
import { accountApi } from "./account-api.ts";
import { validateAdmin, validateCronAuth, validateDeveloper } from "./internal-utils.ts";
import { validateSession } from "./auth-utils.ts";
import { API_URL_PREFIX } from "./constants.tsx";

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
      "X-API-Key",
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
  const apiKey = c.req.header("X-API-Key");
  const validKey = Deno.env.get("HEARD_API_SECRET");

  if (!validKey || apiKey !== validKey) {
    console.warn("Unauthorized API access attempt with invalid API key");
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

app.use("*", async (c, next) => {
  const sessionId = c.req.header("X-Session-Id");
  
  if (sessionId) {
    const validation = await validateSessionId(sessionId);
    
    if (!validation.valid) {
      console.warn(`Unauthorized account access attempt with invalid session`);
      return c.json({ error: validation.error || "Invalid session" }, 401);
    }
    
    c.set("userId", validation.userId);
  }
  
  await next();
});

const protect = (middleware: Parameters<typeof app.use>[1], paths: string[]) => {
  for (const path of paths) app.use(`${API_URL_PREFIX}/${path}`, middleware);
};

// Public
const dontValidate = async (_c: any, next: any) => next();
protect(dontValidate, ["orgs/*", "user/*",]);

// Account
protect(validateSession, [
  "account/*", "activity/*", "chance-card/*", "feedback/*", "flyer/*",
  "import-polis", "public-stats", "rant/*", "room/*", "rooms/*",
  "statement/*", "subheard/*", "subheards", "subheards/*",
  "upload-debate-image", "user-rank", "vine/*", "youtube-card/*",
]);

// Developer
protect(validateDeveloper, [
  "dev/*", "internal/*", "stats/*", "reddit/*",
  "test-room/*", "rant-test-room/*", "realtime-test-room/*", "seed/*",
]);

// Admin
protect(validateAdmin, ["admin/*", "one-time-fixes/*"]);

// Cron
protect(validateCronAuth, ["enrichment/*", "cron/*"]);


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
app.route("/", orgsApi);
app.route("/", cronApi);
app.route("/", reportingApi);
app.route("/", internalConfigApi);
app.route("/", enrichmentApi);
app.route("/", userRankApi);

Deno.serve(app.fetch);