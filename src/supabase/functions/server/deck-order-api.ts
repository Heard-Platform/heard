import { Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { getStatements } from "./debate-api.tsx";
import { getMergesForRoom } from "./model-utils.ts";
import { getClusterIdentityRecord } from "./kv-utils.tsx";
import { buildDeckOrder } from "./statement-ordering.ts";

const app = new Hono();

app.get(
  `${API_URL_PREFIX}/room/:roomId/deck-order`,
  defineRoute(
    { roomId: { type: "string", required: true } },
    async ({ roomId }: { roomId: string }) => {
      const identity = await getClusterIdentityRecord(roomId);
      if (!identity) return { deckOrder: null };

      const [statements, merges] = await Promise.all([
        getStatements(roomId),
        getMergesForRoom(roomId),
      ]);
      const mergeSourceIds = new Set(merges.map((m) => m.sourceStatementId));
      const visibleStatements = statements.filter((s) => !mergeSourceIds.has(s.id));

      return { deckOrder: buildDeckOrder(identity.clusters, visibleStatements) };
    },
    "Failed to build deck order",
  ),
);

export { app as deckOrderApi };
