import { parse } from "@std/dotenv";

const HEARD_REPO_ROOT = new URL("../../", import.meta.url);
const SERVER_FUNCTION_NAME = "make-server-f1a393b4";

export const MODERATOR_SESSION_VARIABLE = "HEARD_MODERATOR_SESSION_ID";
export const SERVICE_ROLE_KEY_VARIABLE = "SUPABASE_SERVICE_ROLE_KEY";

export interface HeardScriptEnvironment {
  apiBaseUrl: string;
  supabaseAnonKey: string;
  heardApiSecret: string;
  moderatorSessionId: string | null;
}

export interface DatabaseEnvironment {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export async function loadHeardScriptEnvironment(): Promise<HeardScriptEnvironment> {
  return buildHeardScriptEnvironment(await readScriptVariables());
}

export async function loadDatabaseEnvironment(): Promise<
  DatabaseEnvironment
> {
  return buildDatabaseEnvironment(await readScriptVariables());
}

export function buildDatabaseEnvironment(
  variables: Record<string, string>,
): DatabaseEnvironment {
  const projectId = requireVariable(
    variables,
    "VITE_SUPABASE_PROJECT_ID",
  );
  return {
    supabaseUrl: `https://${projectId}.supabase.co`,
    serviceRoleKey: requireServiceRoleKey(variables),
  };
}

function requireServiceRoleKey(
  variables: Record<string, string>,
): string {
  const serviceRoleKey = variables[SERVICE_ROLE_KEY_VARIABLE]?.trim();
  if (serviceRoleKey) return serviceRoleKey;
  throw new Error(
    [
      `${SERVICE_ROLE_KEY_VARIABLE} is not set.`,
      "1. In Supabase, open Project Settings, then API.",
      "2. Copy the service_role key.",
      "3. Add a line to .env.local in the Heard repo:",
      `   ${SERVICE_ROLE_KEY_VARIABLE}=<the key>`,
    ].join("\n"),
  );
}

async function readScriptVariables(): Promise<
  Record<string, string>
> {
  return {
    ...(await readEnvFile(".env")),
    ...(await readEnvFile(".env.local")),
    ...Deno.env.toObject(),
  };
}

export function buildHeardScriptEnvironment(variables: Record<string, string>): HeardScriptEnvironment {
  const projectId = requireVariable(variables, "VITE_SUPABASE_PROJECT_ID");
  return {
    apiBaseUrl: `https://${projectId}.supabase.co/functions/v1/${SERVER_FUNCTION_NAME}`,
    supabaseAnonKey: requireVariable(variables, "VITE_SUPABASE_ANON_KEY"),
    heardApiSecret: requireVariable(variables, "VITE_HEARD_API_SECRET"),
    moderatorSessionId: cleanPastedSessionId(variables[MODERATOR_SESSION_VARIABLE]),
  };
}

export function cleanPastedSessionId(pastedValue: string | undefined): string | null {
  const sessionId = pastedValue?.trim().replace(/^["']|["']$/g, "").trim();
  return sessionId ? sessionId : null;
}

export function requireModeratorSessionId(environment: HeardScriptEnvironment): string {
  if (environment.moderatorSessionId) return environment.moderatorSessionId;
  throw new Error(
    [
      `${MODERATOR_SESSION_VARIABLE} is not set.`,
      "1. Sign in on heard.vote with the account that moderates the event's community.",
      "2. Open the browser's developer console and run: localStorage.heard_session_id",
      `3. Add a line to .env.local in the Heard repo: ${MODERATOR_SESSION_VARIABLE}=<the value>`,
    ].join("\n"),
  );
}

function requireVariable(variables: Record<string, string>, name: string): string {
  const value = variables[name]?.trim();
  if (!value) throw new Error(`${name} is missing. It should be in the Heard repo's .env file.`);
  return value;
}

async function readEnvFile(fileName: string): Promise<Record<string, string>> {
  try {
    return parse(await Deno.readTextFile(new URL(fileName, HEARD_REPO_ROOT)));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return {};
    throw error;
  }
}
