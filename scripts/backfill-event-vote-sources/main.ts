import { parseArgs } from "@std/cli/parse-args";
import { backfillAllEventVoteSources } from "./utils.ts";
import {
  loadDatabaseEnvironment,
} from "../shared/heard-script-environment.ts";

const connectToDatabase = async () => {
  const database = await loadDatabaseEnvironment();
  Deno.env.set("SUPABASE_URL", database.supabaseUrl);
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", database.serviceRoleKey);
};

async function backfillEventVoteSources() {
  const options = parseArgs(Deno.args, { boolean: ["write"] });
  await connectToDatabase();
  const isDryRun = !options.write;

  console.log(
    isDryRun
      ? "Dry run: nothing will be written."
      : "Stamping votes...",
  );
  const { stampedVoteCount, backfills } =
    await backfillAllEventVoteSources(isDryRun, Date.now());
  for (const backfill of backfills) {
    console.log(
      `  ${backfill.eventId}  ${backfill.eventName}: ` +
        `${backfill.stampedVoteCount} votes`,
    );
  }
  console.log(
    isDryRun
      ? `Would stamp ${stampedVoteCount} votes. ` +
        "Run with --write to stamp them."
      : `Stamped ${stampedVoteCount} votes as event votes.`,
  );
}

try {
  await backfillEventVoteSources();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  Deno.exit(1);
}
