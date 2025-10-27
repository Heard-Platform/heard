import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { debateApi } from "./debate-api.tsx";
import { adminApi } from "./admin-api.tsx";

const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

Deno.serve(app.fetch);