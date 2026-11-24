import _ from "lodash";
import { parseArgs } from "@std/cli/parse-args";
import { planVoteCopy, voteToRow, type KvVoteRecord } from "./utils.ts";
import type { Vote } from "../../src/supabase/functions/server/types.tsx";
import {
  countRecords,
  createClientFromEnv,
  TABLE_NAME,
} from "../../src/supabase/functions/server/db-utils.ts";
import {
  loadDatabaseEnvironment,
} from "../shared/heard-script-environment.ts";

const VOTES_TABLE_NAME = "votes";
const PAGE_SIZE = 1000;
const WRITE_BATCH_SIZE = 500;

const connectToDatabase = async () => {
  const database = await loadDatabaseEnvironment();
  Deno.env.set("SUPABASE_URL", database.supabaseUrl);
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", database.serviceRoleKey);
  console.log(`Database: ${database.supabaseUrl}`);
};

const readAllKvVoteRecords = async (): Promise<KvVoteRecord[]> => {
  const records: KvVoteRecord[] = [];
  let lastKey = "";
  while (true) {
    const { data, error } = await createClientFromEnv()
      .from(TABLE_NAME)
      .select("key, value")
      .like("key", "vote:%")
      .gt("key", lastKey)
      .order("key", { ascending: true })
      .limit(PAGE_SIZE);
    if (error) throw new Error(error.message);

    const page = (data ?? []) as KvVoteRecord[];
    records.push(...page);
    if (page.length < PAGE_SIZE) return records;
    lastKey = page[page.length - 1].key;
  }
};

const copyVotesToTable = async (votes: Vote[]) => {
  for (const voteBatch of _.chunk(votes, WRITE_BATCH_SIZE)) {
    const { error } = await createClientFromEnv()
      .from(VOTES_TABLE_NAME)
      .upsert(voteBatch.map(voteToRow), {
        onConflict: "statementId,userId",
      });
    if (error) throw new Error(error.message);
  }
};

async function copyVotes() {
  const options = parseArgs(Deno.args, { boolean: ["write"] });
  await connectToDatabase();
  const isDryRun = !options.write;

  console.log(
    isDryRun ? "Dry run: nothing will be written." : "Copying votes...",
  );
  const kvVoteRecords = await readAllKvVoteRecords();
  const plan = planVoteCopy(kvVoteRecords);

  console.log(`KV votes read: ${kvVoteRecords.length}`);
  console.log(`Old format skipped: ${plan.oldFormatSkippedCount}`);
  console.log(
    `Merge leftovers skipped: ${plan.mergeLeftoverSkippedCount}`,
  );
  console.log(`Unreadable skipped: ${plan.unreadableSkippedCount}`);

  if (isDryRun) {
    console.log(
      `Would copy ${plan.votesToCopy.length} votes. ` +
        "Run with --write to copy them.",
    );
    return;
  }

  await copyVotesToTable(plan.votesToCopy);
  const tableVoteCount = await countRecords(VOTES_TABLE_NAME);
  console.log(`Votes copied: ${plan.votesToCopy.length}`);
  console.log(`Votes in table: ${tableVoteCount}`);
  console.log(
    tableVoteCount === plan.votesToCopy.length
      ? "Counts match."
      : "COUNTS DIFFER.",
  );
}

try {
  await copyVotes();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  Deno.exit(1);
}
