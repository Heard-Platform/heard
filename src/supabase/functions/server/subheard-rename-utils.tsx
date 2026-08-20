import { normalizeCommunityName } from "./utils.tsx";
import { update, getAllRecords } from "./db-utils.ts";
import {
  getCommunity,
  saveCommunity,
  deleteCommunity,
  deleteMembership,
  saveMembership,
  getAllDebates,
  saveDebate,
} from "./kv-utils.tsx";
import { CommunityMembership } from "./types.tsx";

export async function performSubHeardRename(
  oldName: string,
  newNameRaw: string,
): Promise<{
  newName: string;
  updatedMemberships: number;
  updatedRooms: number;
  updatedEvents: boolean;
}> {
  const newName = normalizeCommunityName(newNameRaw);
  const displayName = newNameRaw.trim();

  if (newName.length < 2) {
    throw new Error("Sub-heard name must be at least 2 characters");
  }

  const oldCommunity = await getCommunity(oldName);
  if (!oldCommunity) {
    throw new Error("Sub-heard not found");
  }

  const isSlugChange = newName !== oldName;
  const isDisplayNameChange = displayName !== (oldCommunity.displayName ?? oldCommunity.name);

  if (!isSlugChange && !isDisplayNameChange) {
    throw new Error("New name must be different from the current name");
  }

  if (isSlugChange) {
    const existingCommunity = await getCommunity(newName);
    if (existingCommunity) {
      throw new Error("A sub-heard with that name already exists");
    }
  }

  await saveCommunity({ ...oldCommunity, name: newName, displayName });
  if (isSlugChange) {
    await deleteCommunity(oldName);
  }

  if (!isSlugChange) {
    console.log(`Updated display name for sub-heard "${oldName}" to "${displayName}"`);
    return { newName, updatedMemberships: 0, updatedRooms: 0, updatedEvents: false };
  }

  const memberships = await getAllRecords<CommunityMembership>("subheard_member:");
  let updatedMemberships = 0;

  for (const membership of memberships) {
    try {
      if (membership.subHeard === oldName) {
        await deleteMembership(membership.userId, oldName);
        membership.subHeard = newName;
        await saveMembership(membership);
        updatedMemberships++;
      }
    } catch (error) {
      console.error("Error updating membership during sub-heard rename:", error);
    }
  }

  const rooms = await getAllDebates();
  let updatedRooms = 0;

  for (const room of rooms) {
    try {
      if (room.subHeard === oldName) {
        room.subHeard = newName;
        await saveDebate(room);
        updatedRooms++;
      }
    } catch (error) {
      console.error("Error updating room during sub-heard rename:", error);
    }
  }

  let updatedEvents = false;
  try {
    const result = await update("events", { communityName: oldName }, { communityName: newName });
    updatedEvents = result.success;
  } catch (error) {
    console.error("Error updating events during sub-heard rename:", error);
  }

  console.log(`Renamed sub-heard from "${oldName}" to "${newName}"`);
  console.log(`Updated ${updatedMemberships} memberships and ${updatedRooms} rooms`);

  return { newName, updatedMemberships, updatedRooms, updatedEvents };
}
