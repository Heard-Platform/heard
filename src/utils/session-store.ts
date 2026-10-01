import * as Sentry from "@sentry/react";
import { safelyDelStorageItem, safelyGetStorageItem, safelySetStorageItem } from "./localStorage";

const SESSION_ID_KEY = "heard_session_id";
const STORAGE_PROBE_KEY = "heard_storage_probe";
const MAX_SESSION_EVENTS = 12;

export type SessionEventType = "set" | "clear" | "storage_write_failed";

export interface SessionEvent {
  type: SessionEventType;
  source: string;
  msSincePageLoad: number;
}

export type StorageHealth = "ok" | "write_failed" | "unavailable";

export interface SessionDiagnostics {
  storageHealth: StorageHealth;
  hasStoredSession: boolean;
  hasInMemorySession: boolean;
  storedKeys: string[] | null;
  msSincePageLoad: number;
  events: SessionEvent[];
}

let inMemorySessionId: string | null = null;
const sessionEvents: SessionEvent[] = [];

const recordSessionEvent = (type: SessionEventType, source: string) => {
  const event = { type, source, msSincePageLoad: Math.round(performance.now()) };
  sessionEvents.push(event);
  if (sessionEvents.length > MAX_SESSION_EVENTS) {
    sessionEvents.shift();
  }
  Sentry.addBreadcrumb({ category: "session", message: `${type} (${source})`, level: "info" });
};

const readStoredSessionId = (): string | null =>
  safelyGetStorageItem<string | null>(SESSION_ID_KEY, null);

let hasReportedStorageLoss = false;

const reportStorageLossOnce = () => {
  if (hasReportedStorageLoss) return;
  hasReportedStorageLoss = true;
  Sentry.captureMessage("Session ID missing from localStorage; served from memory", {
    level: "warning",
    extra: { diagnostics: getSessionDiagnostics() },
  });
};

export const getSessionId = (): string | null => {
  const storedSessionId = readStoredSessionId();
  if (storedSessionId) return storedSessionId;
  if (inMemorySessionId) reportStorageLossOnce();
  return inMemorySessionId;
};

export const setSessionId = (id: string, source: string): void => {
  inMemorySessionId = id;
  safelySetStorageItem(SESSION_ID_KEY, id);
  recordSessionEvent("set", source);

  if (readStoredSessionId() !== id) {
    recordSessionEvent("storage_write_failed", source);
    Sentry.captureMessage("Session ID could not be persisted to localStorage", {
      level: "warning",
      tags: { sessionSource: source },
      extra: { diagnostics: getSessionDiagnostics() },
    });
  }
};

export const clearSessionId = (reason: string): void => {
  inMemorySessionId = null;
  safelyDelStorageItem(SESSION_ID_KEY);
  recordSessionEvent("clear", reason);
};

const probeStorageHealth = (): StorageHealth => {
  try {
    localStorage.setItem(STORAGE_PROBE_KEY, "1");
    const roundTripped = localStorage.getItem(STORAGE_PROBE_KEY) === "1";
    localStorage.removeItem(STORAGE_PROBE_KEY);
    return roundTripped ? "ok" : "write_failed";
  } catch {
    return "unavailable";
  }
};

const listStoredKeys = (): string[] | null => {
  try {
    return Object.keys(localStorage);
  } catch {
    return null;
  }
};

export const getSessionDiagnostics = (): SessionDiagnostics => ({
  storageHealth: probeStorageHealth(),
  hasStoredSession: readStoredSessionId() !== null,
  hasInMemorySession: inMemorySessionId !== null,
  storedKeys: listStoredKeys(),
  msSincePageLoad: Math.round(performance.now()),
  events: [...sessionEvents],
});
