export const APP_URL = "https://heard.vote";

const MISSING_DISPLAY_KEY_NOTE =
  "(set HEARD_MODERATOR_SESSION_ID to get this link)";

export interface EventLinks {
  eventPage: string;
  display: string | null;
  approval: string | null;
  phone: string;
}

export function buildEventLinks(
  eventId: string,
  displayKey: string | null,
): EventLinks {
  const displayKeyQuery = displayKey ? `?key=${displayKey}` : null;
  return {
    eventPage: `${APP_URL}/event/${eventId}`,
    display: displayKeyQuery
      ? `${APP_URL}/event/${eventId}/display${displayKeyQuery}`
      : null,
    approval: displayKeyQuery
      ? `${APP_URL}/event/${eventId}/approve${displayKeyQuery}`
      : null,
    phone: `${APP_URL}/event/${eventId}/live`,
  };
}

export function formatEventLinks(links: EventLinks): string[] {
  return [
    `  Event page:         ${links.eventPage}`,
    `  Display (runs it):  ${links.display ?? MISSING_DISPLAY_KEY_NOTE}`,
    `  Approval:           ${links.approval ?? MISSING_DISPLAY_KEY_NOTE}`,
    `  Join as a phone:    ${links.phone}`,
  ];
}
