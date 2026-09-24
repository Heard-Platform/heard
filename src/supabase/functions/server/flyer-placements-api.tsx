import { Context, Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { getStatementsForRoom, getVotesForStatement } from "./kv-utils.tsx";
import { getFlyerPlacementsForRoom, insertFlyerPlacements } from "./model-utils.ts";
import {
  attachVoteCounts,
  findFlyerPlacementsError,
  type FlyerPlacementInput,
} from "./flyer-placement-utils.ts";

export const flyerPlacementsApi = new Hono();

flyerPlacementsApi.get(
  `${API_URL_PREFIX}/dev/flyer-placements/:roomId`,
  defineRoute(
    { roomId: { type: "string", required: true } },
    async ({ roomId }: { roomId: string }) => {
      const [statements, placements] = await Promise.all([
        getStatementsForRoom(roomId),
        getFlyerPlacementsForRoom(roomId),
      ]);

      const statementIds = [...new Set(placements.map((placement) => placement.statementId))];
      const votesByStatementId = new Map(
        await Promise.all(
          statementIds.map(async (statementId) => [statementId, await getVotesForStatement(statementId)] as const),
        ),
      );

      return {
        statements: statements.map(({ id, text }) => ({ id, text })),
        flyers: attachVoteCounts(placements, votesByStatementId),
      };
    },
    "Failed to fetch flyer placements",
  ),
);

flyerPlacementsApi.post(
  `${API_URL_PREFIX}/dev/flyer-placements`,
  defineRoute(
    {
      roomId: { type: "string", required: true },
      statementId: { type: "string", required: true },
      flyers: { type: "object", required: true, validate: Array.isArray, errorMessage: "flyers must be an array" },
    },
    async (
      { roomId, statementId, flyers }: { roomId: string; statementId: string; flyers: unknown[] },
      c: Context,
    ) => {
      const [statements, savedPlacements] = await Promise.all([
        getStatementsForRoom(roomId),
        getFlyerPlacementsForRoom(roomId),
      ]);

      if (!statements.some((statement) => statement.id === statementId)) {
        throw new Error("Statement is not a visible statement in this room");
      }

      const savedGroups = new Set(
        savedPlacements
          .filter((placement) => placement.statementId === statementId)
          .map((placement) => placement.flyerGroup),
      );
      const validationError = findFlyerPlacementsError(flyers, savedGroups);
      if (validationError) throw new Error(validationError);

      const createdBy = c.get("userId");
      const result = await insertFlyerPlacements(
        (flyers as FlyerPlacementInput[]).map(({ flyerGroup, latitude, longitude, headingDeg }) => ({
          roomId,
          statementId,
          flyerGroup,
          latitude,
          longitude,
          headingDeg,
          createdBy,
        })),
      );
      if (!result.success) throw new Error(result.error ?? "Failed to save flyer placements");

      return {};
    },
    "Failed to save flyer placements",
  ),
);
