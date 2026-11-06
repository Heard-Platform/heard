import { runInBackground } from "./background-utils.ts";
import {
  completeWithRetry,
  isClusterNamingEnabled,
} from "./cluster-naming.ts";
import {
  EVENT_CAMP_NAME_LIMITS,
  makeClusterNamingPrompt,
  parseClusterNamingResponse,
} from "./cluster-naming-utils.ts";
import type { CampNamingRequest } from "./event-report-camp-utils.ts";
import {
  getEventReportCampNames,
  saveEventReportCampNames,
} from "./kv-utils.tsx";

const requestCampNames = (
  eventName: string,
  campNamingRequest: CampNamingRequest,
): Promise<string[] | null> => {
  const { namingInputs, commonGround } = campNamingRequest;
  const prompt = makeClusterNamingPrompt(
    eventName,
    namingInputs,
    [],
    commonGround,
    EVENT_CAMP_NAME_LIMITS,
  );
  return completeWithRetry(prompt, (raw) =>
    parseClusterNamingResponse(
      raw,
      namingInputs.length,
      [],
      EVENT_CAMP_NAME_LIMITS,
    )
  );
};

const nameCampsAndSave = async (
  eventId: number,
  eventName: string,
  campNamingRequest: CampNamingRequest,
  now: number,
): Promise<void> => {
  const names = await requestCampNames(eventName, campNamingRequest);
  if (!names) {
    console.warn(
      `[EventReport] Couldn't name camps for event ${eventId}`,
    );
    return;
  }
  await saveEventReportCampNames(eventId, {
    membershipSignature: campNamingRequest.membershipSignature,
    names,
    namedAt: now,
  });
};

export const loadEventReportCampNames = async (
  eventId: number,
  eventName: string,
  campNamingRequest: CampNamingRequest | null,
  now: number,
): Promise<string[] | null> => {
  if (!campNamingRequest) return null;
  const savedCampNames = await getEventReportCampNames(eventId);
  const isSameMembership =
    savedCampNames?.membershipSignature ===
      campNamingRequest.membershipSignature;
  if (savedCampNames && isSameMembership) return savedCampNames.names;
  if (await isClusterNamingEnabled()) {
    runInBackground(
      nameCampsAndSave(eventId, eventName, campNamingRequest, now),
      `Naming camps for event ${eventId}`,
    );
  }
  return null;
};
