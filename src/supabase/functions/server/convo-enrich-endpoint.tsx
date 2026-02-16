import { Context, Hono } from "hono";
import { verifyAdminKey } from "./endpoint-utils.tsx";
import { ConvoEnrichService } from "./convo-enrich-service.tsx";

const app = new Hono();

// Apply middleware
app.use("/make-server-f1a393b4/enrichment/*", verifyAdminKey);

// Endpoint - create Heard conversation from Reddit criteria
app.post(
    "/make-server-f1a393b4/enrichment/enrich-convos",
    async (c: Context) => {
        const { userId } = await c.req.json();

        if (!userId || typeof userId !== "string") {
            return c.json({ error: "User ID is required" }, 400);
        }

        console.log({ userId });

        const convoEnrichService = new ConvoEnrichService();
        await convoEnrichService.enrichAppropriateConvos();
        return c.json({
            success: true,
        });
    },
);


// DEBUG below here, creating server for testing purposes
export default app;

// Start server
const port = 3000;
console.log(`Server running on http://localhost:${port}`);

// For Node.js with Hono
import { serve } from '@hono/node-server';
serve({
    fetch: app.fetch,
    port: port,
});