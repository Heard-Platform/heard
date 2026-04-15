// Utility functions for working with KV store data
import { getAllRecords } from "./db-utils.ts";
import * as kv from "./kv_store.tsx";
import {
  type User,
  type Vote,
  type Statement,
  type DebateRoom,
  type SentEmail,
  type ChanceCardStatus,
  type Rant,
  type YouTubeCardStatus,
  MagicLinkRecord,
  Session,
  Community,
  CommunityMembership,
  UserActivityRecord,
} from "./types.tsx";

/**
 * Safely parses JSON data from KV store
 * Handles both string and already-parsed object data
 */
export const parseKvData = <T,>(data: any): T | null => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    console.error("Error parsing KV data:", data, error);
    return null;
  }
};

/**
 * Parses an array of KV data and filters out nulls
 */
export const parseKvDataArray = <T,>(dataArray: any[]): T[] => {
  return dataArray
    .map((data) => parseKvData<T>(data))
    .filter((item): item is T => item !== null);
};

/**
 * Gets all items by prefix and parses them as JSON
 * Combines getByPrefix + parseKvDataArray in one call
 */
export const getByPrefixParsed = async <T,>(
  prefix: string,
): Promise<T[]> => {
  const rawData = await kv.getByPrefix(prefix);
  return parseKvDataArray<T>(rawData);
};

/**
 * Gets a single item from KV store and parses it
 * Handles both stringified JSON and object data
 */
export const getParsedKvData = async <T,>(
  key: string,
): Promise<T | null> => {
  const rawData = await kv.get(key);
  if (!rawData) return null;
  return parseKvData<T>(rawData);
};

export const upsert = async (
  item: any,
  keyFn: (item: any) => string,
) => {
  await kv.set(keyFn(item), JSON.stringify(item));
};

export const bulkGet = async <T,>(
  keys: string[],
): Promise<T[]> => {
  const results = await kv.mget(keys);
  return parseKvDataArray<T>(results);
};

export const bulkUpsert = async (
  items: any[],
  keyFn: (item: any) => string,
) => {
  const records = items.map((item) => ({
    key: keyFn(item),
    value: JSON.stringify(item),
  }));

  const batchSize = 10;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await kv.bulkSet(batch);
  }
};

/**
 * Entity-specific helpers for common KV operations
 */

export const userKeyFn = (user: User) =>
  `user:${user.id}`;

export const getUser = async (userId: string) => {
  return getParsedKvData<User>(`user:${userId}`);
};

export const getAllRealUsers = async (): Promise<User[]> => {
  const allUsers = await getAllRecords<User>("user:");
  return allUsers.filter(user => !user.isTestUser);
};

export const getDevUsers = async (): Promise<User[]> => {
  const allUsers = await getAllRecords<User>("user:");
  return allUsers.filter(user => user.isDeveloper);
};

export const getUserIdByPhone = async (phone: string): Promise<string | null> => {
  return kv.get(phoneKvKeyFn(phone));
};

export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  const normalizedEmail = email.trim().toLowerCase();
  return kv.get(`user_email:${normalizedEmail}`);
};

export const saveUser = async (user: User) => {
  await kv.set(userKeyFn(user), JSON.stringify(user));
};

export const saveUserWithEmailIndex = async (user: User): Promise<void> => {
  await kv.set(userKeyFn(user), JSON.stringify(user));
  await kv.set(`user_email:${user.email}`, user.id);
};

export const updateUserField = async <K extends keyof User>(
  userId: string,
  field: K,
  value: User[K],
) => {
  const user = await getParsedKvData<User>(`user:${userId}`);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  user[field] = value;
  await kv.set(userKeyFn(user), JSON.stringify(user));
};

export const magicLinkKeyFn = (token: string) =>
  `magic_link:${token}`;

export const saveMagicLink = async (
  token: string,
  data: MagicLinkRecord,
) => {
  await kv.set(magicLinkKeyFn(token), data)
};

export const getMagicLink = async (
  token: string,
) => {
  return getParsedKvData<MagicLinkRecord>(magicLinkKeyFn(token));
};

export const deleteMagicLink = async (
  token: string,
) => {
  await kv.del(magicLinkKeyFn(token));
};

export const phoneKvKeyFn = (phone: string) =>
  `user_phone:${phone}`;

export const saveUserPhone = async (
  phone: string,
  userId: string,
) => {
  await kv.set(phoneKvKeyFn(phone), userId);
};

export const deletePhone = async (phone: string) => {
  await kv.del(phoneKvKeyFn(phone));
}

const sessionKeyFn = (session: Session) =>
  `session:${session.id}`;

export const getSession = async (
  sessionId: string,
) => {
  return getParsedKvData<Session>(`session:${sessionId}`);
};

export const saveSession = async (
  session: Session
) => {
  await kv.set(sessionKeyFn(session), session);
};

export const getCommunity = async (name: string) => {
  return getParsedKvData<Community>(`subheard:${name}`);
};

export const getCommunities = async () => {
  const comms = await getByPrefixParsed<Community>("subheard:");
  return comms.map(c => ({
    ...c,
    isPrivate: c.isPrivate || false,
    hostOnlyPosting: c.hostOnlyPosting || false,
  }));
}

export const saveCommunity = async (community: Community) => {
  await kv.set(`subheard:${community.name}`, community);
};

export const deleteCommunity = async (name: string): Promise<void> => {
  await kv.del(`subheard:${name}`);
};

export const membershipKeyFn = (userId: string, subHeardName: string) =>
  `subheard_member:${userId}:${subHeardName}`;

export const getMembership = async (userId: string, subHeardName: string) =>
  getParsedKvData<CommunityMembership>(membershipKeyFn(userId, subHeardName));

export const getMembershipsForUser = async (userId: string): Promise<CommunityMembership[]> => {
  return getByPrefixParsed<CommunityMembership>(`subheard_member:${userId}:`);
};

export const saveMembership = async (membership: CommunityMembership) => {
  await kv.set(
    membershipKeyFn(membership.userId, membership.subHeard),
    JSON.stringify(membership),
  );
}

export const deleteMembership = async (userId: string, subHeardName: string) => {
  const membershipKey = membershipKeyFn(userId, subHeardName);
  await kv.del(membershipKey);
};

export const voteKeyFn = (vote: Vote) =>
  `vote:${vote.statementId}:${vote.userId}`;

export const getVote = async (
  statementId: string,
  userId: string,
): Promise<Vote | null> => {
  return getParsedKvData<Vote>(`vote:${statementId}:${userId}`);
};

export const getAllVotes = async (): Promise<Vote[]> => {
  return getAllRecords<Vote>("vote:");
};

export const getVotesForUser = async (
  userId: string,
): Promise<Vote[]> => {
  return getByPrefixParsed<Vote>(`vote:%:${userId}`);
};

export const getVotesForStatement = async (
  statementId: string,
): Promise<Vote[]> => {
  return getByPrefixParsed<Vote>(`vote:${statementId}:`);
};

export const saveVote = async (vote: Vote) => {
  await kv.set(voteKeyFn(vote), JSON.stringify(vote));
};

export const bulkSaveVotes = async (votes: Vote[]) => {
  await bulkUpsert(votes, voteKeyFn);
};

export const deleteVote = async (
  statementId: string,
  userId: string,
) => {
  await kv.del(`vote:${statementId}:${userId}`);
};

export const statementKeyFn = (statement: Statement) =>
  `statement:${statement.roomId}:${statement.id}`;

export const getAllStatements = async (): Promise<Statement[]> => {
  return getAllRecords<Statement>("statement:");
};

export const getStatement = async (statementId: string): Promise<Statement | null> => {
  return getParsedKvData<Statement>(`statement:%:${statementId}`);
};

export const getStatementsForRoom = async (
  roomId: string,
): Promise<Statement[]> => {
  return getByPrefixParsed<Statement>(`statement:${roomId}:`);
};

export const saveStatement = async (statement: Statement) => {
  await upsert(statement, statementKeyFn);
};

export const bulkSaveStatements = async (statements: Statement[]): Promise<void> => {
  await bulkUpsert(statements, statementKeyFn);
};

export const createRoom = async (room: DebateRoom) => {
  await kv.set(`room:${room.id}`, JSON.stringify(room));
};

export const getAllDebates = async (): Promise<DebateRoom[]> => {
  return getAllRecords<DebateRoom>("room:");
};

export const getAllRealDebates = async (): Promise<DebateRoom[]> => {
  const allRooms = await getAllRecords<DebateRoom>("room:");
  return allRooms.filter(room => !room.isTestRoom);
};

export const debateKeyFn = (debateId: string) => `room:${debateId}`;

export const getDebate = async (debateId: string) => {
  return getParsedKvData<DebateRoom>(debateKeyFn(debateId));
};

export const saveDebate = async (debate: DebateRoom) => {
  await kv.set(debateKeyFn(debate.id), JSON.stringify(debate));
}

export const rantKeyFn = (rant: Rant) =>
  `rant:${rant.roomId}:${rant.id}`;

export const getRantsForRoom = async (roomId: string): Promise<Rant[]> => {
  return getByPrefixParsed<Rant>(`rant:${roomId}:`);
};

export const saveRant = async (rant: Rant): Promise<void> => {
  await kv.set(rantKeyFn(rant), JSON.stringify(rant));
};

export const getAllSubHeards = async <T = any,>(): Promise<
  T[]
> => {
  return getByPrefixParsed<T>("subheard:");
};

export const activityPrefix = "user_activity:";
export const activityKeyFn = (record: UserActivityRecord) =>
  `${activityPrefix}${record.date}:${record.userId}`;

export const getAllActivityRecords = async () =>
  getByPrefixParsed<UserActivityRecord>(activityPrefix);

export const getUserActivityRecords = async (userId: string) =>
  getByPrefixParsed<UserActivityRecord>(`${activityPrefix}:%:${userId}:`);

export const getActivitiesForDate = async (dateStr: string) =>
  getByPrefixParsed<UserActivityRecord>(`${activityPrefix}:${dateStr}:`);

export const upsertUserActivity = async (record: UserActivityRecord) => {
  await upsert(record, activityKeyFn)
}

export const chanceCardStatusKeyFn = (status: ChanceCardStatus) =>
  `chance_card_status:${status.userId}:${status.roomId}`;

export const getUsersChanceCardStatuses = async (
  userId: string,
) => {
  return getAllRecords<ChanceCardStatus>(`chance_card_status:${userId}:`);
};

export const saveChanceCardStatus = async (status: ChanceCardStatus) => {
  await upsert(status, chanceCardStatusKeyFn);
};

export const youtubeCardStatusKeyFn = (status: YouTubeCardStatus) =>
  `youtube_card_status:${status.userId}:${status.roomId}`;

export const getUsersYouTubeCardStatuses = async (
  userId: string,
) => {
  return getAllRecords<YouTubeCardStatus>(`youtube_card_status:${userId}:`);
};

export const saveYouTubeCardStatus = async (status: YouTubeCardStatus) => {
  await upsert(status, youtubeCardStatusKeyFn);
};

export const getSentEmails = async (): Promise<
  SentEmail[]
> => {
  return getAllRecords<SentEmail>("sent_email:");
};

export const getSentEmail = async (emailId: string) => {
  return getParsedKvData<SentEmail>(`sent_email:${emailId}`);
};

export const saveSentEmail = async (email: SentEmail) => {
  await kv.set(`sent_email:${email.id}`, JSON.stringify(email));
};

export const bulkSaveSentEmails = async (emails: SentEmail[]) => {
  await bulkUpsert(emails, (email) => `sent_email:${email.id}`);
};

export const feedbackKeyFn = (feedbackId: string) => `feedback:${feedbackId}`;

export const saveFeedback = async (feedback: { id: string; [key: string]: any }): Promise<void> => {
  await kv.set(feedbackKeyFn(feedback.id), JSON.stringify(feedback));
};

export const getFeedbackList = async (): Promise<any[]> => {
  return getByPrefixParsed<any>("feedback:");
};

// Celebration SMS helpers

export const getCelebrationSmsSent = async (roomId: string): Promise<boolean> => {
  const value = await kv.get(`celebration-sms-sent:${roomId}`);
  return !!value;
};

export const saveCelebrationSmsSent = async (roomId: string): Promise<void> => {
  await kv.set(`celebration-sms-sent:${roomId}`, "true");
};

// Newsletter sent tracking

export const newsletterSentKeyFn = (edition: number) =>
  `newsletter:edition${edition}:sent-users`;

export const getNewsletterSentUsers = async (edition: number): Promise<string[]> => {
  return (await kv.get(newsletterSentKeyFn(edition))) || [];
};

export const saveNewsletterSentUsers = async (edition: number, users: string[]): Promise<void> => {
  await kv.set(newsletterSentKeyFn(edition), users);
};

// Cluster data helpers

export const getClusterAssignment = async (
  roomId: string,
  userId: string,
): Promise<{ clusterId: number; distance: number; timestamp: number } | null> => {
  return getParsedKvData<{ clusterId: number; distance: number; timestamp: number }>(
    `cluster_assignment:${roomId}:${userId}`,
  );
};

export const getClusterMetadataRecord = async (roomId: string): Promise<any | null> => {
  return getParsedKvData<any>(`cluster:${roomId}:metadata`);
};

export const getClusterAssignmentsBatch = async (
  roomId: string,
  userIds: string[],
): Promise<Map<string, { clusterId: number; distance: number; timestamp: number }>> => {
  const keys = userIds.map((userId) => `cluster_assignment:${roomId}:${userId}`);
  const values = await kv.mget(keys);

  const clusters = new Map<string, { clusterId: number; distance: number; timestamp: number }>();
  for (let i = 0; i < userIds.length; i++) {
    if (values[i]) {
      const parsed = parseKvData<{ clusterId: number; distance: number; timestamp: number }>(values[i]);
      if (parsed) {
        clusters.set(userIds[i], parsed);
      }
    }
  }
  return clusters;
};

export const saveClusterData = async (keys: string[], values: string[]): Promise<void> => {
  await kv.mset(keys, values);
};

// Active room pointer helpers

export const getActiveRoomValues = async (): Promise<any[]> => {
  return kv.getByPrefix("active_room:");
};

export const saveActiveRoomPointer = async (roomId: string, value: string): Promise<void> => {
  await kv.set(`active_room:${roomId}`, value);
};