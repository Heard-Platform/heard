// Utility functions for working with KV store data
import * as kv from "./kv_store.tsx";

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

/**
 * Entity-specific helpers for common KV operations
 */

export const getAllUsers = async <T = any,>(): Promise<T[]> => {
  return getByPrefixParsed<T>("user:");
};

export const getAllDebates = async <T = any,>(): Promise<
  T[]
> => {
  return getByPrefixParsed<T>("debate:");
};

export const getAllSubHeards = async <T = any,>(): Promise<
  T[]
> => {
  return getByPrefixParsed<T>("subheard:");
};

export const getAllRooms = async <T = any,>(): Promise<T[]> => {
  return getByPrefixParsed<T>("room:");
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