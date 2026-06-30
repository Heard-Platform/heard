import { Context, Hono } from "npm:hono";
import { getDebateRoom, getStatements } from "./debate-api.tsx";
import { createLlmClient } from "./llm-provider.ts";
import {
  makeAskTheDataPrompt,
  parseAskTheDataResponse,
} from "./ask-the-data-prompt-utils.ts";

const ASK_THE_DATA_ENDPOINT = "/room/ask";
const MAX_QUESTION_CHARS = 500;

const app = new Hono();

app.post(
  "/make-server-f1a393b4/room/:roomId/ask",
  async (c: Context) => {
    try {
      const roomId = c.req.param("roomId");
      if (!roomId) {
        return c.json({ error: "Room ID is required" }, 400);
      }

      const body = (await c.req.json().catch(() => ({}))) as {
        question?: unknown;
      };
      const question = body.question;

      if (typeof question !== "string" || question.trim().length === 0) {
        return c.json({ error: "Question is required" }, 400);
      }
      if (question.length > MAX_QUESTION_CHARS) {
        return c.json(
          { error: `Question must be at most ${MAX_QUESTION_CHARS} characters` },
          400,
        );
      }

      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      const statements = await getStatements(roomId);

      const userId = c.get("userId") as string | undefined;
      const client = createLlmClient();
      const prompt = makeAskTheDataPrompt(room.topic, statements, question);
      const content = await client.completeJson(prompt, {
        userId,
        endpoint: ASK_THE_DATA_ENDPOINT,
      });

      return c.json(parseAskTheDataResponse(content));
    } catch (error) {
      console.error("Error answering Ask the Data question:", error);
      return c.json({ error: "Failed to answer question" }, 500);
    }
  },
);

export { app as askTheDataApi };
