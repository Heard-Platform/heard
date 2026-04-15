import { getMembershipsForUser } from "./kv-utils.tsx";

/**
 * Get all sub-heard memberships for a user
 * Returns a Set of sub-heard names the user is a member of
 */
export async function getUserMemberships(
  userId: string,
): Promise<Set<string>> {
  const memberships = await getMembershipsForUser(userId);
  const membershipSet = new Set<string>();

  for (const membership of memberships) {
    if (membership.subHeard) {
      membershipSet.add(membership.subHeard);
    }
  }

  return membershipSet;
}
