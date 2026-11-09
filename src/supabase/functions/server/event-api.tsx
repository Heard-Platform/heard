// @ts-ignore
import { Context, Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { getUserSession } from "./auth-api.tsx";
import { normalizeCommunityName } from "./utils.tsx";
import { getAllRecords, selectAll, selectAllWithoutLimit } from "./db-utils.ts";
import { filterFeedEvents } from "./feed-utils.ts";
import { getUserMemberships } from "./membership-utils.tsx";
import { insertEvent } from "./model-utils.ts";
import {
  applyEventAction,
  getEventOrThrow,
  getOrCreateEventDisplayKey,
  loadEventReport,
  loadEventView,
  loadSupportViewStats,
  parseEventId,
  requireCanDriveEvent,
  setEventStatementHidden,
} from "./event-utils.ts";
import {
  getAllDebates,
  getCommunities,
  getCommunity,
  getEventDisplayKey,
  getLiveEventState,
  getStatementsForRoom,
  getUser,
  getVotesForUser,
  saveEventPresence,
  saveLiveEventState,
} from "./kv-utils.tsx";
import { RouteError } from "./route-error.ts";
import {
  isValidOnboardingQuestionList,
  loadAttendeeOnboarding,
  loadEventOnboardingQuestionList,
  ONBOARDING_QUESTIONS_ERROR_MESSAGE,
  replaceEventOnboardingQuestions,
  saveEventDemographicAnswer,
} from "./event-onboarding-utils.ts";
import {
  canDriveEvent,
  canModerateEvent,
  isCommunityModerator,
  EVENT_ACTIONS,
  type EventActionName,
  eventStateOrDefault,
  isLiveScreen,
} from "./live-event-utils.ts";
import type { Event, CommunityMembership, EventOnboardingQuestionInput, LiveScreen } from "./types.tsx";

const app = new Hono();

const EVENT_ID_PATTERN = /^\d+$/;

const EVENT_ID_PARAM_SCHEMA = {
  type: "string",
  required: true,
  validate: (eventId: string) => EVENT_ID_PATTERN.test(eventId),
  errorMessage: "A valid event ID is required",
} as const;

app.post(
  "/make-server-f1a393b4/event/create",
  defineRoute(
    {
      name: {
        type: "string",
        required: true,
        validate: (val) => val.trim().length > 0,
        errorMessage: "Event name is required",
      },
      subtitle: {
        type: "string",
        required: false,
      },
      communityName: {
        type: "string",
        required: true,
        validate: (val) => val.trim().length > 0,
        errorMessage: "Community is required",
      },
    },
    async (
      { name, subtitle, communityName }: { name: string; subtitle?: string; communityName: string },
      c: Context,
    ) => {
      const userId = c.get("userId");

      const user = await getUserSession(userId);
      if (!user) throw new RouteError("User session not found", 404);
      if (user.isAnonymous) throw new RouteError("Anonymous users cannot create events", 403);

      const normalizedCommunityName = normalizeCommunityName(communityName);

      const community = await getCommunity(normalizedCommunityName);
      if (!community) throw new RouteError("Community not found", 404);
      if (!isCommunityModerator(userId, community)) {
        throw new RouteError("Only moderators can create events in this community", 403);
      }

      const event = await insertEvent({
        name: name.trim(),
        subtitle: subtitle?.trim() ?? "",
        communityName: normalizedCommunityName,
        creatorId: userId,
      });

      return { event };
    },
    "Failed to create event",
  ),
);

app.get(
  "/make-server-f1a393b4/events",
  defineRoute(
    {},
    async (_params, c: Context) => {
      const userId = c.get("userId");
      const community = c.req.query("community");

      const [events, communities, memberships] = await Promise.all([
        selectAllWithoutLimit<Event>("events", community ? { communityName: community } : undefined),
        getCommunities(),
        getUserMemberships(userId),
      ]);

      const visibleEvents = filterFeedEvents(events, communities, memberships, userId, community);

      const summaries = visibleEvents.map((event) => ({
        id: event.id,
        name: event.name,
        subtitle: event.subtitle,
        communityName: event.communityName,
      }));

      return { events: summaries };
    },
    "Failed to fetch events",
  ),
);

app.get(
  "/make-server-f1a393b4/event/:eventId",
  defineRoute(
    {},
    async (_params, c: Context) => {
      const eventIdStr = c.req.param("eventId");
      if (!eventIdStr) throw new Error("Event ID is required");
      const eventId = Number(eventIdStr);
      const userId = c.get("userId");

      const [eventRows] = await selectAll<Event>("events", { id: eventId });
      if (!eventRows) throw new Error("Event not found");

      const [allRooms, userVotes, allMemberships, community] = await Promise.all([
        getAllDebates(),
        getVotesForUser(userId),
        getAllRecords<CommunityMembership>("subheard_member:"),
        getCommunity(eventRows.communityName),
      ]);

      const canModerate = canModerateEvent(userId, eventRows, community);
      const votedStatementIds = new Set(userVotes.map((v) => v.statementId));
      const totalMembers = allMemberships.filter(
        (m) => m.subHeard === eventRows.communityName,
      ).length;

      const displayKey = canModerate ? await getOrCreateEventDisplayKey(eventId) : null;
      const now = Date.now();
      const eventRooms = allRooms.filter((r) => r.eventId === eventId);

      const enrichedRooms = await Promise.all(
        eventRooms.map(async (room) => {
          const [statements, participantUsers] = await Promise.all([
            getStatementsForRoom(room.id),
            Promise.all(room.participants.slice(0, 4).map((pid) => getUser(pid))),
          ]);

          const unvotedCount = statements.filter(
            (s) => !votedStatementIds.has(s.id),
          ).length;
          const userHasVoted = statements.some((s) => votedStatementIds.has(s.id));
          const isCompleted = !room.isActive || (room.endTime != null && room.endTime < now);

          const status = isCompleted
            ? "completed"
            : unvotedCount > 0 || statements.length === 0
              ? "needs_input"
              : "caught_up";

          const participantAvatars = participantUsers
            .filter(Boolean)
            .map((u) => u!.avatarAnimal ?? "koala");

          return {
            id: room.id,
            topic: room.topic,
            description: room.description,
            emoji: room.emoji,
            participants: room.participants,
            createdAt: room.createdAt,
            endTime: room.endTime,
            status,
            userHasVoted,
            newStatementCount: unvotedCount,
            participantAvatars,
          };
        }),
      );

      return {
        event: {
          id: eventRows.id,
          name: eventRows.name,
          subtitle: eventRows.subtitle,
          communityName: eventRows.communityName,
          totalMembers,
          rooms: enrichedRooms,
          canModerate,
          displayKey,
        },
      };
    },
    "Failed to fetch event",
  ),
);

app.get(
  "/make-server-f1a393b4/event/:eventId/live",
  defineRoute(
    {
      screen: {
        type: "string",
        required: false,
        validate: isLiveScreen,
        errorMessage: "Unknown screen",
      },
      shownRoomId: {
        type: "string",
        required: false,
      },
    },
    async ({ screen, shownRoomId }: { screen?: LiveScreen; shownRoomId?: string }, c: Context) => {
      const eventId = parseEventId(c.req.param("eventId"));
      const userId = c.get("userId");
      const now = Date.now();
      const presence = screen && userId
        ? { userId, shownRoomId: shownRoomId || null, screen, updatedAt: now }
        : null;

      const [stored] = await Promise.all([
        getLiveEventState(eventId),
        presence && saveEventPresence(eventId, presence),
      ]);
      const state = eventStateOrDefault(stored, now);
      return { live: await loadEventView(eventId, state, now) };
    },
    "Failed to fetch live event",
  ),
);

app.post(
  "/make-server-f1a393b4/event/:eventId/live",
  defineRoute(
    {
      action: {
        type: "string",
        required: true,
        validate: (val) => (EVENT_ACTIONS as readonly string[]).includes(val),
        errorMessage: "Unknown live event action",
      },
      roomOrder: {
        type: "array",
        required: false,
        validate: (val: unknown[]) => val.every((id) => typeof id === "string"),
        errorMessage: "roomOrder must be a list of post IDs",
      },
      fromIndex: {
        type: "number",
        required: false,
        validate: (val: number) => Number.isInteger(val) && val >= 0,
        errorMessage: "fromIndex must be a post position",
      },
      displayKey: {
        type: "string",
        required: false,
      },
    },
    async (
      {
        action,
        roomOrder,
        fromIndex,
        displayKey,
      }: { action: EventActionName; roomOrder?: string[]; fromIndex?: number; displayKey?: string },
      c: Context,
    ) => {
      const eventId = parseEventId(c.req.param("eventId"));
      const userId = c.get("userId");

      const event = await getEventOrThrow(eventId);
      const community = await getCommunity(event.communityName);
      const isModerator = canModerateEvent(userId, event, community);
      if (action === "reorder" && !isModerator) {
        throw new RouteError(`Only moderators of ${event.communityName} can reorder this event`, 403);
      }
      if (action !== "reorder" && !canDriveEvent(isModerator, displayKey, await getEventDisplayKey(eventId))) {
        throw new RouteError("This link can't run the event. Open the display link from the event page.", 403);
      }

      const now = Date.now();
      const state = eventStateOrDefault(await getLiveEventState(eventId), now);
      const next = await applyEventAction(eventId, state, action, { roomOrder, fromIndex }, now);

      await saveLiveEventState(eventId, next);
      return { live: await loadEventView(eventId, next, now) };
    },
    "Failed to update live event",
  ),
);

app.get(
  "/make-server-f1a393b4/event/:eventId/support",
  defineRoute(
    {
      displayKey: {
        type: "string",
        required: false,
      },
    },
    async ({ displayKey }: { displayKey?: string }, c: Context) => {
      const eventId = parseEventId(c.req.param("eventId"));
      const event = await getEventOrThrow(eventId);
      await requireCanDriveEvent(event, c.get("userId"), displayKey);

      const now = Date.now();
      const state = eventStateOrDefault(await getLiveEventState(eventId), now);
      return { stats: await loadSupportViewStats(event, state, now) };
    },
    "Failed to load the support view",
  ),
);

app.get(
  "/make-server-f1a393b4/event/:eventId/report",
  defineRoute(
    {},
    async (_params, c: Context) => ({
      report: await loadEventReport(
        parseEventId(c.req.param("eventId")),
        Date.now(),
      ),
    }),
    "Failed to load the event report",
  ),
);

app.post(
  "/make-server-f1a393b4/event/:eventId/support/statement/:statementId/hidden",
  defineRoute(
    {
      statementId: { type: "string", required: true },
      isHidden: { type: "boolean", required: true },
      displayKey: {
        type: "string",
        required: false,
      },
    },
    async (
      { statementId, isHidden, displayKey }: { statementId: string; isHidden: boolean; displayKey?: string },
      c: Context,
    ) => {
      const eventId = parseEventId(c.req.param("eventId"));
      const userId = c.get("userId");
      if (!userId) {
        throw new RouteError("User session not found", 404);
      }
      const event = await getEventOrThrow(eventId);
      await requireCanDriveEvent(event, userId, displayKey);

      const state = eventStateOrDefault(await getLiveEventState(eventId), Date.now());
      return { statement: await setEventStatementHidden(state, statementId, isHidden, userId) };
    },
    "Failed to update statement visibility",
  ),
);

app.get(
  "/make-server-f1a393b4/event/:eventId/onboarding/questions",
  defineRoute(
    { eventId: EVENT_ID_PARAM_SCHEMA },
    async ({ eventId }: { eventId: string }) =>
      loadEventOnboardingQuestionList(Number(eventId)),
    "Failed to load onboarding questions",
  ),
);

app.put(
  "/make-server-f1a393b4/event/:eventId/onboarding/questions",
  defineRoute(
    {
      eventId: EVENT_ID_PARAM_SCHEMA,
      questions: {
        type: "array",
        required: true,
        validate: isValidOnboardingQuestionList,
        errorMessage: ONBOARDING_QUESTIONS_ERROR_MESSAGE,
      },
    },
    async (
      {
        eventId,
        questions,
      }: {
        eventId: string;
        questions: EventOnboardingQuestionInput[];
      },
      c: Context,
    ) => ({
      questions: await replaceEventOnboardingQuestions(
        Number(eventId),
        c.get("userId"),
        questions,
      ),
    }),
    "Failed to save onboarding questions",
  ),
);

app.get(
  "/make-server-f1a393b4/event/:eventId/onboarding",
  defineRoute(
    { eventId: EVENT_ID_PARAM_SCHEMA },
    async ({ eventId }: { eventId: string }, c: Context) =>
      loadAttendeeOnboarding(Number(eventId), c.get("userId")),
    "Failed to load onboarding",
  ),
);

app.post(
  "/make-server-f1a393b4/event/:eventId/demographic-answers",
  defineRoute(
    {
      eventId: EVENT_ID_PARAM_SCHEMA,
      questionId: { type: "number", required: true },
      answers: {
        type: "array",
        required: true,
        validate: (answers: unknown[]) =>
          answers.every((answer) => typeof answer === "string"),
        errorMessage: "answers must be a list of options",
      },
    },
    async (
      {
        eventId,
        questionId,
        answers,
      }: { eventId: string; questionId: number; answers: string[] },
      c: Context,
    ) =>
      saveEventDemographicAnswer(
        Number(eventId),
        c.get("userId"),
        questionId,
        answers,
      ),
    "Failed to save the answer",
  ),
);

export { app as eventApi };
