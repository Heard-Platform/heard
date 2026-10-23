import { parseArgs } from "@std/cli/parse-args";
import { HeardApiClient } from "../shared/heard-api-client.ts";
import { loadHeardScriptEnvironment, requireModeratorSessionId } from "../shared/heard-script-environment.ts";
import { addPostsToEvent } from "../shared/event-post-creation.ts";
import { parseEventPostsFile } from "./event-posts-file.ts";

const USAGE = "Usage: npm run add-event-posts -- --event <event id> --posts <path to posts JSON, e.g. scripts/event-posts/value-based-pricing.json> [--add-to-existing]";
const APP_URL = "https://heard.vote";

async function addEventPosts() {
  const options = parseArgs(Deno.args, { string: ["event", "posts"], boolean: ["add-to-existing"] });
  if (!options.event || !options.posts) throw new Error(USAGE);

  const drafts = parseEventPostsFile(await Deno.readTextFile(options.posts));
  const environment = await loadHeardScriptEnvironment();
  const api = new HeardApiClient(environment, requireModeratorSessionId(environment));

  const { event } = await api.getEvent(options.event);
  if (!event.canModerate) throw new Error(`Your account can't moderate event ${event.id} (${event.name}).`);

  const { live } = await api.getLiveEvent(event.id);
  if (live.status !== "setup") {
    throw new Error(`Event ${event.id} has already started, so new posts wouldn't join the session.`);
  }
  if (event.rooms.length > 0 && !options["add-to-existing"]) {
    throw new Error(
      `Event ${event.id} already has ${event.rooms.length} posts. Run again with --add-to-existing to add these after them.`,
    );
  }

  console.log(`Adding ${drafts.length} posts to "${event.name}" in ${event.communityName}...`);
  await addPostsToEvent(api, { eventId: event.id, communityName: event.communityName }, drafts, (post, postNumber) =>
    console.log(`  ${postNumber}/${drafts.length}  ${post.topic}`)
  );
  console.log(`Done. Check the order in setup: ${APP_URL}/event/${event.id}/moderate`);
}

try {
  await addEventPosts();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  Deno.exit(1);
}
