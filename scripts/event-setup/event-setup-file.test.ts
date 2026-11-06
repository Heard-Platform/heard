import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  EventSetupFileError,
  parseEventSetupFile,
} from "./event-setup-file.ts";
import { EventPostsFileError } from "../event-posts/event-posts-file.ts";

const VALID_SETUP = {
  name: "  Town hall  ",
  communityName: "test",
  onboardingQuestions: [
    { text: " Are you a... ", options: [" Student ", "Faculty"] },
    {
      text: "How do you identify?",
      options: ["Black", "White"],
      multiSelect: true,
    },
  ],
  posts: [{ topic: "Warm-up debates", statements: ["One."] }],
};

const parseSetup = (overrides: Record<string, unknown>) =>
  parseEventSetupFile(
    JSON.stringify({ ...VALID_SETUP, ...overrides }),
  );

Deno.test(
  "parseEventSetupFile reads the event, questions and posts",
  () => {
    assertEquals(parseEventSetupFile(JSON.stringify(VALID_SETUP)), {
      newEvent: {
        name: "Town hall",
        subtitle: undefined,
        communityName: "test",
      },
      content: {
        posts: [{ topic: "Warm-up debates", statements: ["One."] }],
        onboardingQuestions: [
          {
            text: "Are you a...",
            options: ["Student", "Faculty"],
            multiSelect: false,
          },
          {
            text: "How do you identify?",
            options: ["Black", "White"],
            multiSelect: true,
          },
        ],
      },
    });
  },
);

Deno.test(
  "parseEventSetupFile allows an event with no questions",
  () => {
    const setup = parseSetup({ onboardingQuestions: undefined });
    assertEquals(setup.content.onboardingQuestions, []);
  },
);

Deno.test("parseEventSetupFile refuses invalid JSON", () => {
  assertThrows(
    () => parseEventSetupFile("{"),
    EventPostsFileError,
    "isn't valid JSON",
  );
});

Deno.test(
  "parseEventSetupFile refuses a list instead of an object",
  () => {
    assertThrows(
      () => parseEventSetupFile("[]"),
      EventSetupFileError,
      "JSON object",
    );
  },
);

Deno.test(
  "parseEventSetupFile refuses a blank name or community",
  () => {
    assertThrows(
      () => parseSetup({ name: " " }),
      EventSetupFileError,
      '"name"',
    );
    assertThrows(
      () => parseSetup({ communityName: undefined }),
      EventSetupFileError,
      '"communityName"',
    );
  },
);

Deno.test("parseEventSetupFile checks the posts", () => {
  assertThrows(
    () => parseSetup({ posts: [] }),
    EventPostsFileError,
    "at least one post",
  );
});

Deno.test(
  "parseEventSetupFile names a question without options",
  () => {
    assertThrows(
      () =>
        parseSetup({
          onboardingQuestions: [
            VALID_SETUP.onboardingQuestions[0],
            { text: "Empty?", options: [] },
          ],
        }),
      EventSetupFileError,
      "Question 2 needs",
    );
  },
);

Deno.test("parseEventSetupFile names a blank option", () => {
  assertThrows(
    () =>
      parseSetup({
        onboardingQuestions: [{ text: "Role?", options: ["A", " "] }],
      }),
    EventSetupFileError,
    "Question 1, option 2",
  );
});

Deno.test(
  "parseEventSetupFile refuses a listed Prefer not to say",
  () => {
    assertThrows(
      () =>
        parseSetup({
          onboardingQuestions: [
            { text: "Role?", options: ["A", "Prefer not to say"] },
          ],
        }),
      EventSetupFileError,
      "automatically",
    );
  },
);

Deno.test(
  "parseEventSetupFile refuses a non-boolean pick-any",
  () => {
    assertThrows(
      () =>
        parseSetup({
          onboardingQuestions: [
            { text: "Role?", options: ["A"], multiSelect: "yes" },
          ],
        }),
      EventSetupFileError,
      '"multiSelect"',
    );
  },
);
