import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isUnsourcedSessionVote,
  stampAsEventVote,
} from "./utils.ts";
import type {
  Vote,
} from "../../src/supabase/functions/server/types.tsx";

const SESSION_WINDOW = { startedAt: 1000, endedAt: 2000 };

Deno.test(
  "isUnsourcedSessionVote - takes unsourced votes inside the session",
  () => {
    for (const timestamp of [1000, 1500, 2000]) {
      assertEquals(
        isUnsourcedSessionVote({ timestamp }, SESSION_WINDOW),
        true,
      );
    }
  },
);

Deno.test(
  "isUnsourcedSessionVote - skips votes before Start or after End",
  () => {
    for (const timestamp of [999, 2001]) {
      assertEquals(
        isUnsourcedSessionVote({ timestamp }, SESSION_WINDOW),
        false,
      );
    }
  },
);

Deno.test(
  "isUnsourcedSessionVote - skips votes that have a source",
  () => {
    for (const source of ["event", "feed"] as const) {
      assertEquals(
        isUnsourcedSessionVote(
          { source, timestamp: 1500 },
          SESSION_WINDOW,
        ),
        false,
      );
    }
  },
);

Deno.test(
  "stampAsEventVote - sets the source and keeps the rest",
  () => {
    const vote: Vote = {
      id: "vote",
      statementId: "statement",
      userId: "attendee",
      voteType: "agree",
      timestamp: 1500,
    };

    assertEquals(stampAsEventVote(vote), {
      ...vote,
      source: "event",
    });
  },
);
