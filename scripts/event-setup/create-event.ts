import { parseArgs } from "@std/cli/parse-args";
import { HeardApiClient } from "../shared/heard-api-client.ts";
import {
  loadHeardScriptEnvironment,
  requireModeratorSessionId,
} from "../shared/heard-script-environment.ts";
import { createEventWithContent } from "../shared/event-creation.ts";
import { buildEventLinks } from "../shared/event-links.ts";
import { parseEventSetupFile } from "./event-setup-file.ts";

const USAGE =
  'Usage: npm run create-event -- --setup <path to event setup JSON> [--name "Dry run 2"]';

async function createEvent() {
  const options = parseArgs(Deno.args, {
    string: ["setup", "name"],
  });
  if (!options.setup) throw new Error(USAGE);

  const setup = parseEventSetupFile(
    await Deno.readTextFile(options.setup),
  );
  const newEvent = {
    ...setup.newEvent,
    name: options.name?.trim() || setup.newEvent.name,
  };
  const environment = await loadHeardScriptEnvironment();
  const moderatorApi = new HeardApiClient(
    environment,
    requireModeratorSessionId(environment),
  );

  console.log(
    `Creating "${newEvent.name}" in ${newEvent.communityName} with ${setup.content.posts.length} posts and ${setup.content.onboardingQuestions.length} onboarding questions...`,
  );
  const eventId = await createEventWithContent(
    moderatorApi,
    newEvent,
    setup.content,
  );
  const { event } = await moderatorApi.getEvent(eventId);
  const links = buildEventLinks(eventId, event.displayKey);
  console.log(`Done. Event ${eventId}`);
  console.log(`  Moderator controls: ${links.moderatorControls}`);
  console.log(`  Display:            ${links.display ?? "(none)"}`);
  console.log(`  Join as a phone:    ${links.phone}`);
}

try {
  await createEvent();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  Deno.exit(1);
}
