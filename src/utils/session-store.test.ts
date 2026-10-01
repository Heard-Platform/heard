import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/react", () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
}));

const createWorkingStorage = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
  };
};

const createBlockedStorage = () => ({
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("SecurityError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
});

const loadSessionStore = async () => {
  vi.resetModules();
  return import("./session-store");
};

describe("session-store", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("with working storage", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", createWorkingStorage());
    });

    it("returns the session that was set", async () => {
      const store = await loadSessionStore();
      store.setSessionId("session-1", "test");
      expect(store.getSessionId()).toBe("session-1");
    });

    it("returns null after the session is cleared", async () => {
      const store = await loadSessionStore();
      store.setSessionId("session-1", "test");
      store.clearSessionId("test");
      expect(store.getSessionId()).toBeNull();
    });

    it("reports healthy storage in diagnostics", async () => {
      const store = await loadSessionStore();
      store.setSessionId("session-1", "vote_via_flyer");
      const diagnostics = store.getSessionDiagnostics();
      expect(diagnostics.storageHealth).toBe("ok");
      expect(diagnostics.hasStoredSession).toBe(true);
      expect(diagnostics.events.map((event) => event.type)).toEqual(["set"]);
    });
  });

  describe("when the browser drops the stored session", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", createWorkingStorage());
    });

    it("serves the session from memory", async () => {
      const store = await loadSessionStore();
      store.setSessionId("session-1", "vote_via_flyer");
      localStorage.removeItem("heard_session_id");
      expect(store.getSessionId()).toBe("session-1");
    });

    it("reports the loss to Sentry only once", async () => {
      const store = await loadSessionStore();
      const Sentry = await import("@sentry/react");
      vi.mocked(Sentry.captureMessage).mockClear();
      store.setSessionId("session-1", "vote_via_flyer");
      localStorage.removeItem("heard_session_id");
      store.getSessionId();
      store.getSessionId();
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("with blocked storage", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", createBlockedStorage());
    });

    it("still returns the session that was set", async () => {
      const store = await loadSessionStore();
      store.setSessionId("session-1", "vote_via_flyer");
      expect(store.getSessionId()).toBe("session-1");
    });

    it("returns null after the session is cleared", async () => {
      const store = await loadSessionStore();
      store.setSessionId("session-1", "vote_via_flyer");
      store.clearSessionId("reset_session");
      expect(store.getSessionId()).toBeNull();
    });

    it("records the failed write and reports unavailable storage", async () => {
      const store = await loadSessionStore();
      store.setSessionId("session-1", "vote_via_flyer");
      const diagnostics = store.getSessionDiagnostics();
      expect(diagnostics.storageHealth).toBe("unavailable");
      expect(diagnostics.hasStoredSession).toBe(false);
      expect(diagnostics.hasInMemorySession).toBe(true);
      expect(diagnostics.events.map((event) => event.type)).toEqual(["set", "storage_write_failed"]);
    });
  });
});
