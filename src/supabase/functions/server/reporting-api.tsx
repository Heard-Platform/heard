import { insertUserReport } from "./model-utils.ts";
import { NewUserReport } from "./types.tsx";
import { AuthedHono } from "./hono-wrapper.ts";

const authedApp = new AuthedHono();

authedApp.post(
  "/make-server-f1a393b4/statement/:statementId/flag",
  async (c: any) => {
    try {
      const statementId = c.req.param("statementId");
      const { roomId } = await c.req.json();
      const userId = c.get("userId");

      if (!userId || !roomId || !statementId) {
        return c.json(
          { error: "userId, roomId, and statementId are required" },
          400,
        );
      }

      const report: NewUserReport = {
        responseId: statementId,
        reportingUserId: userId,
      };

      const result = await insertUserReport(report);

      if (!result.success) {
        return c.json(
          { error: result.error || "Failed to flag statement" },
          500,
        );
      }

      return c.json({ success: true });
    } catch (error) {
      console.error("Error flagging statement:", error);
      return c.json(
        { error: "Failed to flag statement" },
        500,
      );
    }
  },
);

export { authedApp as reportingApi };