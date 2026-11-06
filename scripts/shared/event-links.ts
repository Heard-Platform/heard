export const APP_URL = "https://heard.vote";

export interface EventLinks {
  moderatorControls: string;
  display: string | null;
  phone: string;
}

export function buildEventLinks(
  eventId: string,
  displayKey: string | null,
): EventLinks {
  return {
    moderatorControls: `${APP_URL}/event/${eventId}/moderate`,
    display: displayKey
      ? `${APP_URL}/event/${eventId}/display?key=${displayKey}`
      : null,
    phone: `${APP_URL}/event/${eventId}/live`,
  };
}
