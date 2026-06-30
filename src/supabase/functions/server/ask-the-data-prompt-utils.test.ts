import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import {
  ALLOWED_AVENUES,
  makeAskTheDataPrompt,
  parseAskTheDataResponse,
  PARSE_FALLBACK_MESSAGE,
  REJECT_RULES,
} from "./ask-the-data-prompt-utils.ts";
import { Statement } from "./types.tsx";

const STATEMENT: Statement = {
  id: "stmt",
  text: "",
  author: "author",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId: "room",
  timestamp: 0,
  round: 0,
  voters: {},
};

describe("makeAskTheDataPrompt", () => {
  const topic = "How should DC handle bike infrastructure?";
  const statements: Statement[] = [
    {
      ...STATEMENT,
      id: "a",
      text: "Protected bike lanes make streets safer",
      agrees: 5,
      disagrees: 2,
      passes: 1,
      superAgrees: 3,
    },
    {
      ...STATEMENT,
      id: "b",
      text: "Parking is too scarce downtown",
      agrees: 4,
      disagrees: 6,
      passes: 0,
      superAgrees: 1,
    },
  ];
  const question = "Which response is the most divisive?";
  const { userPrompt } = makeAskTheDataPrompt(topic, statements, question);

  it("includes the topic", () => {
    assert(userPrompt.includes(topic));
  });

  it("includes every statement's text", () => {
    for (const statement of statements) {
      assert(userPrompt.includes(statement.text));
    }
  });

  it("includes each statement's vote counts", () => {
    assert(userPrompt.includes("agree: 5, disagree: 2, pass: 1, super-agree: 3"));
    assert(userPrompt.includes("agree: 4, disagree: 6, pass: 0, super-agree: 1"));
  });

  it("includes the user's question", () => {
    assert(userPrompt.includes(question));
  });

  it("includes the allowlist and the reject rules", () => {
    assert(userPrompt.includes(ALLOWED_AVENUES));
    assert(userPrompt.includes(REJECT_RULES));
  });
});

describe("parseAskTheDataResponse", () => {
  it("parses a clean answered response", () => {
    assertEquals(
      parseAskTheDataResponse(
        '{"status":"answered","response":"Statement B is the most divisive."}',
      ),
      { status: "answered", response: "Statement B is the most divisive." },
    );
  });

  it("parses a clean rejected response", () => {
    assertEquals(
      parseAskTheDataResponse(
        '{"status":"rejected","response":"That is outside this conversation."}',
      ),
      { status: "rejected", response: "That is outside this conversation." },
    );
  });

  it("strips markdown fences before parsing", () => {
    assertEquals(
      parseAskTheDataResponse('```json\n{"status":"answered","response":"Yes."}\n```'),
      { status: "answered", response: "Yes." },
    );
  });

  it("degrades malformed JSON to a safe rejection", () => {
    assertEquals(parseAskTheDataResponse("not json at all"), {
      status: "rejected",
      response: PARSE_FALLBACK_MESSAGE,
    });
  });

  it("degrades an unrecognized status to a safe rejection", () => {
    assertEquals(parseAskTheDataResponse('{"status":"maybe","response":"hmm"}'), {
      status: "rejected",
      response: PARSE_FALLBACK_MESSAGE,
    });
  });

  it("degrades an empty response to a safe rejection", () => {
    assertEquals(parseAskTheDataResponse('{"status":"answered","response":""}'), {
      status: "rejected",
      response: PARSE_FALLBACK_MESSAGE,
    });
  });
});
