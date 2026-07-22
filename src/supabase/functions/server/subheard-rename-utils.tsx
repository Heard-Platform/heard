import { normalizeCommunityName } from "./utils.tsx";
import { update } from "./db-utils.ts";
import {
  getCommunity,
  saveCommunity,
  deleteCommunity,
  getByPrefixParsed,
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

  if (newName.length < 2) {
    throw new Error("Sub-heard name must be at least 2 characters");
  }

  if (newName === oldName) {
    throw new Error("New name must be different from the current name");
  }

  const existingCommunity = await getCommunity(newName);
  if (existingCommunity) {
    throw new Error("A sub-heard with that name already exists");
  }

  const oldCommunity = await getCommunity(oldName);
  if (!oldCommunity) {
    throw new Error("Sub-heard not found");
  }

  await saveCommunity({ ...oldCommunity, name: newName });
  await deleteCommunity(oldName);

  const memberships = await getByPrefixParsed<CommunityMembership>("subheard_member:");
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
