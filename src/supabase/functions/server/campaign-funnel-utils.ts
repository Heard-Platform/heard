import _ from "lodash";
import {
  getDebate,
  getStatementsCreatedSince,
  getStatementsForRoomIncludingHidden,
  getUsersByIds,
  getUsersCreatedSince,
  getVotesCreatedSince,
} from "./kv-utils.tsx";
import { getAllEventsOfType, getFlyerScansForFlyer, getRoomViewsSeenSince } from "./model-utils.ts";
import { FLYER_SCREEN_EVENTS, PERSONAL_FLYER_SCREEN_EVENTS } from "./feature-tracker-utils.ts";
import { toTimestamp } from "./time-utils.ts";
import type { RoomView, Statement, User, Vote } from "./types.tsx";

export interface CampaignConfig {
  name: string;
  roomId: string;
  flyerId: string;
  directUrlFlyers: string[];
  flyerScreenEmailEventTypes: string[];
}

export interface CampaignFunnelSteps {
  arrived: number;
  addedEmailOnFlyerScreen: number;
  votedMoreThanOnce: number;
  addedResponse: number;
  viewedSecondPost: number;
  votedOnSecondPost: number;
  addedEmailLater: number;
}

// Each person is attributed to the channel they first arrived through.
export interface CampaignFunnel {
  campaignName: string;
  flyerScan: CampaignFunnelSteps;
  directUrl: CampaignFunnelSteps;
  arrivedViaBoth: number;
}

export interface TimeRange {
  from: number | null;
  to: number;
}

export interface TimedUserAction {
  userId: string | null;
  createdAt: number;
}

export interface CampaignFunnelInput {
  users: User[];
  votes: Vote[];
  statements: Pick<Statement, "author" | "timestamp">[];
  campaignRoomStatementIds: string[];
  roomViews: RoomView[];
  directUrlScans: TimedUserAction[];
  flyerScreenEmailEvents: TimedUserAction[];
}

type ArrivalChannel = "flyerScan" | "directUrl";

interface Arrival {
  userId: string;
  at: number;
  channel: ArrivalChannel;
}

interface CampaignVisitor {
  firstArrival: Arrival;
  channels: Set<ArrivalChannel>;
}

const MAX_MERGE_DEPTH = 10;

// Anonymous users who later sign in are merged into their account; votes, statements and
// room views move to the account, but events and scans stay on the anonymous id.
export const createPersonResolver = (usersById: Map<string, User>) => (userId: string): string => {
  let currentId = userId;
  for (let depth = 0; depth < MAX_MERGE_DEPTH; depth++) {
    const mergedIntoUserId = usersById.get(currentId)?.mergedIntoUserId;
    if (!mergedIntoUserId) break;
    currentId = mergedIntoUserId;
  }
  return currentId;
};

const isInRange = (at: number, range: TimeRange) => (range.from === null || at >= range.from) && at <= range.to;

const isExcludedUser = (user: User | undefined) =>
  !!user && (!!user.isTestUser || !!user.isDeveloper || !!user.webdriver);

const flyerVoteArrivals = (votes: Vote[], campaign: CampaignConfig): Arrival[] =>
  votes
    .filter((vote) => vote.flyerId === campaign.flyerId)
    .map((vote) => ({ userId: vote.anonymousUserId ?? vote.userId, at: vote.timestamp, channel: "flyerScan" }));

const flyerUserArrivals = (users: User[], campaign: CampaignConfig): Arrival[] =>
  users
    .filter((user) => user.flyerId === campaign.flyerId)
    .map((user) => ({ userId: user.id, at: user.createdAt, channel: "flyerScan" }));

const directUrlArrivals = (scans: TimedUserAction[]): Arrival[] =>
  scans
    .filter((scan): scan is TimedUserAction & { userId: string } => !!scan.userId)
    .map((scan) => ({ userId: scan.userId, at: scan.createdAt, channel: "directUrl" }));

const collectArrivals = (input: CampaignFunnelInput, campaign: CampaignConfig): Arrival[] => [
  ...flyerVoteArrivals(input.votes, campaign),
  ...flyerUserArrivals(input.users, campaign),
  ...directUrlArrivals(input.directUrlScans),
];

const groupArrivalsByPerson = (
  arrivals: Arrival[],
  resolvePerson: (userId: string) => string,
  usersById: Map<string, User>,
  range: TimeRange,
): Map<string, CampaignVisitor> => {
  const visitors = new Map<string, CampaignVisitor>();
  for (const arrival of arrivals) {
    if (!isInRange(arrival.at, range)) continue;
    const personId = resolvePerson(arrival.userId);
    if (isExcludedUser(usersById.get(personId)) || isExcludedUser(usersById.get(arrival.userId))) continue;

    const visitor = visitors.get(personId);
    if (!visitor) {
      visitors.set(personId, { firstArrival: arrival, channels: new Set([arrival.channel]) });
      continue;
    }
    visitor.channels.add(arrival.channel);
    if (arrival.at < visitor.firstArrival.at) visitor.firstArrival = arrival;
  }
  return visitors;
};

export function buildCampaignFunnel(
  input: CampaignFunnelInput,
  campaign: CampaignConfig,
  range: TimeRange,
): CampaignFunnel {
  const usersById = new Map(input.users.map((user) => [user.id, user]));
  const resolvePerson = createPersonResolver(usersById);
  const campaignRoomStatementIds = new Set(input.campaignRoomStatementIds);
  const visitors = groupArrivalsByPerson(collectArrivals(input, campaign), resolvePerson, usersById, range);

  const arrivedAt = (userId: string | null) => {
    if (!userId) return undefined;
    const personId = resolvePerson(userId);
    const visitor = visitors.get(personId);
    return visitor && { personId, at: visitor.firstArrival.at };
  };

  const peopleWhoAfterArriving = <T>(
    items: T[],
    getUserId: (item: T) => string | null,
    getTimestamp: (item: T) => number,
    isMatch: (item: T) => boolean = () => true,
  ) => {
    const personIds = new Set<string>();
    for (const item of items) {
      const arrival = arrivedAt(getUserId(item));
      if (arrival && getTimestamp(item) >= arrival.at && isMatch(item)) personIds.add(arrival.personId);
    }
    return personIds;
  };

  const isOtherPostVote = (vote: Vote) => !campaignRoomStatementIds.has(vote.statementId);

  const voteCountsByPerson = new Map<string, number>();
  for (const vote of input.votes) {
    const arrival = arrivedAt(vote.userId);
    if (!arrival || vote.timestamp < arrival.at) continue;
    voteCountsByPerson.set(arrival.personId, (voteCountsByPerson.get(arrival.personId) ?? 0) + 1);
  }
  const votedMoreThanOnce = new Set(
    [...voteCountsByPerson.entries()].filter(([, count]) => count > 1).map(([personId]) => personId),
  );

  const addedEmailOnFlyerScreen = peopleWhoAfterArriving(
    input.flyerScreenEmailEvents,
    (event) => event.userId,
    (event) => event.createdAt,
  );

  const addedResponse = peopleWhoAfterArriving(
    input.statements,
    (statement) => statement.author,
    (statement) => statement.timestamp,
  );

  const viewedSecondPost = peopleWhoAfterArriving(
    input.roomViews,
    (view) => view.userId,
    (view) => view.lastSeenAt,
    (view) => view.roomId !== campaign.roomId,
  );

  const votedOnSecondPost = peopleWhoAfterArriving(
    input.votes,
    (vote) => vote.userId,
    (vote) => vote.timestamp,
    isOtherPostVote,
  );

  const wasAnonymousAtArrival = ({ firstArrival }: CampaignVisitor) => {
    const arrivalUser = usersById.get(firstArrival.userId);
    if (!arrivalUser) return false;
    return !!arrivalUser.isAnonymous || (arrivalUser.upgradedFromAnonymousAt ?? 0) > firstArrival.at;
  };

  const hasEmailNow = (personId: string) => {
    const user = usersById.get(personId);
    return !!user?.email && !user.isAnonymous;
  };

  const addedEmailLater = new Set(
    [...visitors.entries()]
      .filter(([personId, visitor]) =>
        !addedEmailOnFlyerScreen.has(personId) && wasAnonymousAtArrival(visitor) && hasEmailNow(personId)
      )
      .map(([personId]) => personId),
  );

  const stepsForChannel = (channel: ArrivalChannel): CampaignFunnelSteps => {
    const channelPersonIds = [...visitors.entries()]
      .filter(([, visitor]) => visitor.firstArrival.channel === channel)
      .map(([personId]) => personId);
    const countIn = (personIds: Set<string>) => channelPersonIds.filter((personId) => personIds.has(personId)).length;
    return {
      arrived: channelPersonIds.length,
      addedEmailOnFlyerScreen: countIn(addedEmailOnFlyerScreen),
      votedMoreThanOnce: countIn(votedMoreThanOnce),
      addedResponse: countIn(addedResponse),
      viewedSecondPost: countIn(viewedSecondPost),
      votedOnSecondPost: countIn(votedOnSecondPost),
      addedEmailLater: countIn(addedEmailLater),
    };
  };

  return {
    campaignName: campaign.name,
    flyerScan: stepsForChannel("flyerScan"),
    directUrl: stepsForChannel("directUrl"),
    arrivedViaBoth: [...visitors.values()].filter((visitor) => visitor.channels.size > 1).length,
  };
}

const WAYMO_DC_ROOM_ID = "s6r23ralcomq8l9p6p";

export const CAMPAIGNS: Record<string, CampaignConfig> = {
  waymo: {
    name: "Waymo flyering",
    roomId: WAYMO_DC_ROOM_ID,
    flyerId: WAYMO_DC_ROOM_ID,
    directUrlFlyers: ["waymo", "waymodc"],
    flyerScreenEmailEventTypes: [FLYER_SCREEN_EVENTS.emailAdded, PERSONAL_FLYER_SCREEN_EVENTS.emailAdded],
  },
};

const getDirectUrlScans = async (flyers: string[]): Promise<TimedUserAction[]> => {
  const scans = (await Promise.all(flyers.map(getFlyerScansForFlyer))).flat();
  return scans.map((scan) => ({ userId: scan.userId, createdAt: toTimestamp(scan.createdAt) }));
};

const getEventsOfTypes = async (types: string[]): Promise<TimedUserAction[]> => {
  const events = (await Promise.all(types.map(getAllEventsOfType))).flat();
  return events.map((event) => ({ userId: event.userId, createdAt: toTimestamp(event.createdAt) }));
};

// Visitors and their merged accounts can predate the campaign, so they are fetched by id.
const addArrivalUsersAndMergeTargets = async (users: User[], arrivalUserIds: string[]): Promise<User[]> => {
  const usersById = new Map(users.map((user) => [user.id, user]));
  const findMissingIds = (candidateIds: (string | undefined)[]) =>
    _.uniq(_.compact(candidateIds)).filter((id) => !usersById.has(id));

  let missingIds = findMissingIds([...arrivalUserIds, ...users.map((user) => user.mergedIntoUserId)]);
  for (let depth = 0; missingIds.length > 0 && depth < MAX_MERGE_DEPTH; depth++) {
    const fetchedUsers = await getUsersByIds(missingIds);
    for (const user of fetchedUsers) usersById.set(user.id, user);
    missingIds = findMissingIds(fetchedUsers.map((user) => user.mergedIntoUserId));
  }
  return [...usersById.values()];
};

// Only actions after a visitor arrives are counted, and no one arrives before the campaign
// room exists, so everything older than that (or the start of the range) can be skipped.
const getEarliestRelevantTime = async (campaign: CampaignConfig, range: TimeRange): Promise<number> => {
  const room = await getDebate(campaign.roomId);
  if (!room) throw new Error(`Campaign room ${campaign.roomId} not found`);
  return Math.max(range.from ?? 0, room.createdAt);
};

export const getCampaignFunnel = async (campaign: CampaignConfig, range: TimeRange): Promise<CampaignFunnel> => {
  const sinceTs = await getEarliestRelevantTime(campaign, range);
  const [recentUsers, votes, statements, campaignRoomStatements, roomViews, directUrlScans, flyerScreenEmailEvents] =
    await Promise.all([
      getUsersCreatedSince(sinceTs),
      getVotesCreatedSince(sinceTs),
      getStatementsCreatedSince(sinceTs),
      getStatementsForRoomIncludingHidden(campaign.roomId),
      getRoomViewsSeenSince(sinceTs),
      getDirectUrlScans(campaign.directUrlFlyers),
      getEventsOfTypes(campaign.flyerScreenEmailEventTypes),
    ]);

  const arrivalUserIds = [...flyerVoteArrivals(votes, campaign), ...directUrlArrivals(directUrlScans)].map(
    (arrival) => arrival.userId,
  );
  const users = await addArrivalUsersAndMergeTargets(recentUsers, arrivalUserIds);

  return buildCampaignFunnel(
    {
      users,
      votes,
      statements,
      campaignRoomStatementIds: campaignRoomStatements.map((statement) => statement.id),
      roomViews,
      directUrlScans,
      flyerScreenEmailEvents,
    },
    campaign,
    range,
  );
};
