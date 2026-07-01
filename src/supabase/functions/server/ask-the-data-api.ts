import { Hono, type Context } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { getDebateRoom, getStatements } from "./debate-api.tsx";
import { createLlmClient } from "./llm-provider.ts";
import { saveAskTheDataRecord } from "./kv-utils.tsx";
import { generateId } from "./utils.tsx";
import { buildDevAlertEmailHtml, sendEmailToDevs } from "./dev-utils.tsx";
import {
  makeAskTheDataPrompt,
  parseAskTheDataResponse,
} from "./ask-the-data-prompt-utils.ts";

const ASK_THE_DATA_ENDPOINT = "ask-the-data";
const MAX_QUESTION_CHARS = 500;

async function sendRejectedQuestionEmail({
  roomId,
  userId,
  question,
  response,
}: {
  roomId: string;
  userId: string;
  question: string;
  response: string;
}) {
  const emailHtml = buildDevAlertEmailHtml({
    title: "⚠️ Ask the Data Question Rejected",
    gradientFrom: "#f59e0b",
    gradientTo: "#b45309",
    metadata: [
      { label: "Room ID", value: roomId },
      { label: "User ID", value: userId || "unknown" },
      { label: "Time", value: new Date().toISOString() },
    ],
    sections: [
      { heading: "Question", body: question },
      { heading: "Rejection message", body: response },
    ],
  });

  const normalizedQuestion = question.replace(/\s+/g, " ").trim();
  const preview = normalizedQuestion.substring(0, 50);
  await sendEmailToDevs({
    from: "Heard Reports <hello@heard-now.com>",
    subject: `⚠️ Ask the Data question rejected: "${preview}${normalizedQuestion.length > 50 ? "..." : ""}"`,
    html: emailHtml,
  });
}

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
      const id = generateId();

      await saveAskTheDataRecord({
        id,
        roomId,
        userId,
        question,
        answer: result.response,
        status: result.status,
        createdAt: Date.now(),
      });

      if (result.status === "rejected") {
        try {
          await sendRejectedQuestionEmail({
            roomId,
            userId,
            question,
            response: result.response,
          });
        } catch (emailError) {
          console.error("Failed to send ask-the-data rejection email:", emailError);
        }
      }

      return { ...result, id };
    },
    "Failed to answer question",
  ),
);

export { app as askTheDataApi };
