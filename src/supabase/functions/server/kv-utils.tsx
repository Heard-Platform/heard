// Utility functions for working with KV store data
import { getAllRecords } from "./db-utils.ts";
import * as kv from "./kv_store.tsx";
import type {
  UserSession,
  Vote,
  Statement,
  DebateRoom,
  SentEmail,
  ChanceCardStatus,
  Rant,
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

export const userKeyFn = (user: UserSession) =>
  `user:${user.id}`;

export const getUser = async (userId: string) => {
  return getParsedKvData<UserSession>(`user:${userId}`);
};

export const getAllRealUsers = async (): Promise<UserSession[]> => {
  const allUsers = await getAllRecords<UserSession>("user:");
  return allUsers.filter(user => !user.isTestUser);
};

export const getDevUsers = async (): Promise<UserSession[]> => {
  const allUsers = await getAllRecords<UserSession>("user:");
  return allUsers.filter(user => user.isDeveloper);
};

export const saveUser = async (user: UserSession) => {
  await kv.set(userKeyFn(user), JSON.stringify(user));
};

export const updateUserField = async <K extends keyof UserSession>(
  userId: string,
  field: K,
  value: UserSession[K],
) => {
  const user = await getParsedKvData<UserSession>(`user:${userId}`);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  user[field] = value;
  await kv.set(userKeyFn(user), JSON.stringify(user));
};

export const voteKeyFn = (vote: Vote) =>
  `vote:${vote.statementId}:${vote.userId}`;

export const getVotesForUser = async (
  userId: string,
): Promise<Vote[]> => {
  return getByPrefixParsed<Vote>(`vote:%:${userId}`);
};

export const saveVote = async (vote: Vote) => {
  await kv.set(voteKeyFn(vote), JSON.stringify(vote));
};

export const bulkSaveVotes = async (votes: Vote[]) => {
  await bulkUpsert(votes, voteKeyFn);
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

export const createRoom = async (room: DebateRoom) => {
  await kv.set(`room:${room.id}`, JSON.stringify(room));
};

export const getAllDebates = async (): Promise<DebateRoom[]> => {
  return getAllRecords<DebateRoom>("room:");
};

export const getDebate = async (debateId: string) => {
  return getParsedKvData<DebateRoom>(`room:${debateId}`);
};

export const rantKeyFn = (rant: Rant) =>
  `rant:${rant.roomId}:${rant.id}`;

export const getAllSubHeards = async <T = any,>(): Promise<
  T[]
> => {
  return getByPrefixParsed<T>("subheard:");
};

export const getUserActivityRecords = async <T = any,>(
  userId: string,
): Promise<T[]> => {
  return getByPrefixParsed<T>(`activity:daily:${userId}:`);
};

export const getActivitiesForDate = async <T = any,>(
  dateStr: string,
): Promise<T[]> => {
  return getByPrefixParsed<T>(`user_activity:${dateStr}:`);
};

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