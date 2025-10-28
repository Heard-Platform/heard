import * as kv from "./kv_store.tsx";

/**
 * Get all sub-heard memberships for a user
 * Returns a Set of sub-heard names the user is a member of
 */
export async function getUserMemberships(userId: string): Promise<Set<string>> {
  const membershipKeys = await kv.getByPrefix(`subheard_member:${userId}:`);
  const memberships = new Set<string>();

  for (const key of membershipKeys) {
    try {
      const data = JSON.parse(key);
      if (data.subHeard) {
        memberships.add(data.subHeard);
      }
    } catch (error) {
      console.error("Error parsing membership:", error);
    }
  }

  return memberships;
}
