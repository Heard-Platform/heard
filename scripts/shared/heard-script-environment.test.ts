import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildHeardScriptEnvironment,
  cleanPastedSessionId,
  MODERATOR_SESSION_VARIABLE,
  requireModeratorSessionId,
} from "./heard-script-environment.ts";

const viteVariables = {
  VITE_SUPABASE_PROJECT_ID: "project",
  VITE_SUPABASE_ANON_KEY: "anon-key",
  VITE_HEARD_API_SECRET: "api-secret",
};

Deno.test("buildHeardScriptEnvironment points at the Heard server function", () => {
  assertEquals(buildHeardScriptEnvironment(viteVariables), {
    apiBaseUrl: "https://project.supabase.co/functions/v1/make-server-f1a393b4",
    supabaseAnonKey: "anon-key",
    heardApiSecret: "api-secret",
    moderatorSessionId: null,
  });
});

Deno.test("buildHeardScriptEnvironment names a missing variable", () => {
  assertThrows(
    () => buildHeardScriptEnvironment({ ...viteVariables, VITE_HEARD_API_SECRET: " " }),
    Error,
    "VITE_HEARD_API_SECRET is missing",
  );
});

Deno.test("cleanPastedSessionId strips the quotes the browser console shows", () => {
  assertEquals(cleanPastedSessionId(` "abc123" `), "abc123");
  assertEquals(cleanPastedSessionId("'abc123'"), "abc123");
  assertEquals(cleanPastedSessionId("abc123"), "abc123");
  assertEquals(cleanPastedSessionId(`""`), null);
  assertEquals(cleanPastedSessionId(undefined), null);
});

Deno.test("requireModeratorSessionId explains how to get the session", () => {
  const environment = buildHeardScriptEnvironment(viteVariables);
  assertThrows(() => requireModeratorSessionId(environment), Error, "localStorage.heard_session_id");
  assertEquals(
    requireModeratorSessionId(buildHeardScriptEnvironment({ ...viteVariables, [MODERATOR_SESSION_VARIABLE]: "abc" })),
    "abc",
  );
});
