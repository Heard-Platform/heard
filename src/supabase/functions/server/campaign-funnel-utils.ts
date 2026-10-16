import { getAllStatements, getAllUsers, getAllVotes } from "./kv-utils.tsx";
import { getAllEventsOfType, getAllRoomViews, getFlyerScansForFlyer } from "./model-utils.ts";
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
  didAnythingMore: number;
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
  statements: Pick<Statement, "id" | "roomId" | "author" | "timestamp">[];
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
  const roomIdByStatementId = new Map(input.statements.map((statement) => [statement.id, statement.roomId]));
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

  const isOtherPostVote = (vote: Vote) => {
    const roomId = roomIdByStatementId.get(vote.statementId);
    return !!roomId && roomId !== campaign.roomId;
  };

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

  const didAnythingMore = new Set([
    ...addedEmailOnFlyerScreen,
    ...votedMoreThanOnce,
    ...addedResponse,
    ...viewedSecondPost,
    ...votedOnSecondPost,
    ...addedEmailLater,
  ]);

  const stepsForChannel = (channel: ArrivalChannel): CampaignFunnelSteps => {
    const channelPersonIds = [...visitors.entries()]
      .filter(([, visitor]) => visitor.firstArrival.channel === channel)
      .map(([personId]) => personId);
    const countIn = (personIds: Set<string>) => channelPersonIds.filter((personId) => personIds.has(personId)).length;
    return {
      arrived: channelPersonIds.length,
      didAnythingMore: countIn(didAnythingMore),
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

export const getCampaignFunnel = async (campaign: CampaignConfig, range: TimeRange): Promise<CampaignFunnel> => {
  const [users, votes, statements, roomViews, directUrlScans, flyerScreenEmailEvents] = await Promise.all([
    getAllUsers(),
    getAllVotes(),
    getAllStatements(),
    getAllRoomViews(),
    getDirectUrlScans(campaign.directUrlFlyers),
    getEventsOfTypes(campaign.flyerScreenEmailEventTypes),
  ]);

  return buildCampaignFunnel(
    { users, votes, statements, roomViews, directUrlScans, flyerScreenEmailEvents },
    campaign,
    range,
  );
};
