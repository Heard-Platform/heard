import { Hono } from "npm:hono";
import type { UserSession } from "./types.tsx";
import { getUser, saveUser, getDebate } from "./kv-utils.tsx";
import type { VoteType } from "./types.tsx";
import { processVote } from "./voting-utils.ts";

export const flyerApi = new Hono();

type FlyerVoteResponse = {
  user: UserSession;
  room: any;
  agreePercent: number;
  disagreePercent: number;
  passPercent: number;
  userVote: VoteType;
};

flyerApi.post("/make-server-f1a393b4/flyer/vote", async (c) => {
  try {
    const {
      flyerId,
      statementId,
      vote,
      userId: providedUserId,
    } = await c.req.json();

    if (!flyerId || !statementId || !vote) {
      return c.json(
        {
          success: false,
          error:
            "Missing required fields: flyerId, statementId, vote",
        },
        400,
      );
    }

    let userId = "";

    if (providedUserId) {
      const existingUser = await getUser(providedUserId);
      if (existingUser) {
        userId = providedUserId;
      }
    }

    if (!userId) {
      userId = crypto.randomUUID();
      const newUser: UserSession = {
        id: userId,
        nickname: `FlyerUser_${flyerId.slice(0, 8)}`,
        email: "",
        score: 0,
        streak: 0,
        lastActive: Date.now(),
        createdAt: Date.now(),
        isAnonymous: true,
        emailDigestsEnabled: false,
        flyerId,
      };

      await saveUser(newUser);
    }

    const result = await processVote(
      statementId,
      userId,
      vote as VoteType,
      flyerId,
      true,
    );

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        400,
      );
    } else {
      const room = await getDebate(result.statement.roomId);
      if (!room) {
        return c.json(
          { success: false, error: "Room not found" },
          404,
        );
      }

      const totalVotes =
        result.statement.agrees +
        result.statement.disagrees +
        result.statement.passes;
      const agreePercent =
        totalVotes > 0
          ? Math.round((result.statement.agrees / totalVotes) * 100)
          : 0;
      const disagreePercent =
        totalVotes > 0
          ? Math.round(
              (result.statement.disagrees / totalVotes) * 100,
            )
          : 0;
      const passPercent =
        totalVotes > 0
          ? Math.round((result.statement.passes / totalVotes) * 100)
          : 0;

      const response: FlyerVoteResponse = {
        user: result.user,
        room,
        agreePercent,
        disagreePercent,
        passPercent,
        userVote: result.userVote as VoteType,
      };

      return c.json(response, 200);
    }
  } catch (error) {
    console.error("Error processing flyer vote:", error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});