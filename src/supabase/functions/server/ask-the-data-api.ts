import { Hono, type Context } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { getDebateRoom, getStatements } from "./debate-api.tsx";
import { createLlmClient } from "./llm-provider.ts";
import { saveAskTheDataRecord } from "./kv-utils.tsx";
import { generateId } from "./utils.tsx";
import {
  makeAskTheDataPrompt,
  parseAskTheDataResponse,
} from "./ask-the-data-prompt-utils.ts";

const ASK_THE_DATA_ENDPOINT = "ask-the-data";
const MAX_QUESTION_CHARS = 500;

const app = new Hono();

app.post(
  "/make-server-f1a393b4/room/:roomId/ask",
  defineRoute(
    {
      roomId: { type: "string", required: true },
      question: {
        type: "string",
        required: true,
        validate: (value: string) =>
          value.trim().length > 0 && value.length <= MAX_QUESTION_CHARS,
        errorMessage: `Question is required and must be at most ${MAX_QUESTION_CHARS} characters`,
      },
    },
    async ({ roomId, question }: { roomId: string; question: string }, c: Context) => {
      const room = await getDebateRoom(roomId);
      if (!room) throw new Error("Room not found");

      const statements = await getStatements(roomId);

      const userId = c.get("userId") as string;
      const client = createLlmClient();
      const prompt = makeAskTheDataPrompt(room.topic, statements, question);
      const content = await client.completeJson(prompt, {
        userId,
        endpoint: ASK_THE_DATA_ENDPOINT,
      });

      const result = parseAskTheDataResponse(content);

      await saveAskTheDataRecord({
        id: generateId(),
        roomId,
        userId,
        question,
        answer: result.response,
        status: result.status,
        createdAt: Date.now(),
      });

      return result;
    },
    "Failed to answer question",
  ),
);

export { app as askTheDataApi };
