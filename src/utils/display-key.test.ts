import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { takeDisplayKeyFromUrl } from "./display-key";

const ORIGIN = "https://heard.vote";

let currentHref = "";
let storedValues: Map<string, string>;

const openAt = (path: string) => {
  currentHref = `${ORIGIN}${path}`;
};

beforeEach(() => {
  storedValues = new Map();
  vi.stubGlobal("window", {
    location: {
      get href() {
        return currentHref;
      },
      origin: ORIGIN,
    },
    history: {
      replaceState: (_state: unknown, _title: string, path: string) => openAt(path),
    },
  });
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storedValues.get(key) ?? null,
    setItem: (key: string, value: string) => storedValues.set(key, value),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("takeDisplayKeyFromUrl", () => {
  it("returns the key from the URL and removes it from the address bar", () => {
    openAt("/event/4/display?key=secret");
    expect(takeDisplayKeyFromUrl("4")).toBe("secret");
    expect(currentHref).toBe(`${ORIGIN}/event/4/display`);
  });

  it("keeps the key for a reload of the same tab", () => {
    openAt("/event/4/display?key=secret");
    takeDisplayKeyFromUrl("4");
    openAt("/event/4/display");
    expect(takeDisplayKeyFromUrl("4")).toBe("secret");
  });

  it("keeps each event's key separate", () => {
    openAt("/event/4/display?key=secret");
    takeDisplayKeyFromUrl("4");
    openAt("/event/3/display");
    expect(takeDisplayKeyFromUrl("3")).toBeNull();
  });

  it("still returns the key when session storage is unavailable", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    openAt("/event/4/display?key=secret");
    expect(takeDisplayKeyFromUrl("4")).toBe("secret");
    openAt("/event/4/display");
    expect(takeDisplayKeyFromUrl("4")).toBeNull();
  });
});
