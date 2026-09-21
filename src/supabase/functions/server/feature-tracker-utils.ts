import { getSentEmails } from "./kv-utils.tsx";
import { getEventsOfType, getAllRoomViews } from "./model-utils.ts";
import {
  RESPONSE_VOTES_NOTIF_EMAIL_TYPE,
  RESPONSE_VOTES_NOTIF_BUTTON_CLICKED_EVENT,
} from "./email-response-votes-notif-template.ts";

const RESPONSE_VOTES_NOTIF_RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const getResponseVotesNotifStats = async (): Promise<{
  emailsSent: number;
  buttonClicks: number;
  returnedWithinWeek: number;
}> => {
  const sentEmails = (await getSentEmails()).filter(
    (email) => email.emailType === RESPONSE_VOTES_NOTIF_EMAIL_TYPE,
  );
  const buttonClicks = (
    await getEventsOfType(RESPONSE_VOTES_NOTIF_BUTTON_CLICKED_EVENT)
  ).length;

  const allRoomViews = await getAllRoomViews();
  const lastSeenAtByUserRoom = new Map<string, number>();
  for (const view of allRoomViews) {
    lastSeenAtByUserRoom.set(`${view.userId}:${view.roomId}`, view.lastSeenAt);
  }

  const returnedWithinWeek = sentEmails.filter((email) => {
    if (!email.roomId) return false;
    const lastSeenAt = lastSeenAtByUserRoom.get(`${email.userId}:${email.roomId}`);
    if (!lastSeenAt) return false;
    return (
      lastSeenAt >= email.sentAt &&
      lastSeenAt <= email.sentAt + RESPONSE_VOTES_NOTIF_RETURN_WINDOW_MS
    );
  }).length;

  return { emailsSent: sentEmails.length, buttonClicks, returnedWithinWeek };
};
