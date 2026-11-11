import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getIntervalWithBackoff,
  MAXIMUM_POLL_INTERVAL_MS,
  POLL_TIME_LIMIT_MS,
  startPollingLoop,
  type PollingLoop,
} from "./polling-loop";

const INTERVAL_MS = 1000;

interface PendingPoll {
  resolve: (didSucceed: boolean) => void;
  stopSignal: AbortSignal;
}

let pendingPolls: PendingPoll[];
let isPageHidden: boolean;
let loop: PollingLoop | null;

const poll = (stopSignal: AbortSignal) =>
  new Promise<boolean>((resolve) => {
    pendingPolls.push({ resolve, stopSignal });
  });

const startLoop = () => {
  loop = startPollingLoop({
    poll,
    intervalMs: INTERVAL_MS,
    isPageHidden: () => isPageHidden,
  });
  return loop;
};

const finishLatestPoll = async (didSucceed: boolean) => {
  pendingPolls[pendingPolls.length - 1].resolve(didSucceed);
  await vi.advanceTimersByTimeAsync(0);
};

beforeEach(() => {
  vi.useFakeTimers();
  pendingPolls = [];
  isPageHidden = false;
  loop = null;
});

afterEach(() => {
  loop?.stop();
  vi.useRealTimers();
});

describe("getIntervalWithBackoff", () => {
  it("polls at the base rate while requests succeed", () => {
    expect(getIntervalWithBackoff(3000, 0)).toBe(3000);
  });

  it("doubles the wait after each failure in a row", () => {
    expect(getIntervalWithBackoff(3000, 1)).toBe(6000);
    expect(getIntervalWithBackoff(3000, 2)).toBe(12000);
  });

  it("caps the wait", () => {
    expect(getIntervalWithBackoff(3000, 10)).toBe(
      MAXIMUM_POLL_INTERVAL_MS,
    );
  });
});

describe("startPollingLoop", () => {
  it("polls right away", () => {
    startLoop();
    expect(pendingPolls).toHaveLength(1);
  });

  it("waits for a slow poll before starting the next", async () => {
    startLoop();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 5);
    expect(pendingPolls).toHaveLength(1);
  });

  it("polls again one interval after a poll finishes", async () => {
    startLoop();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);
    await finishLatestPoll(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS - 1);
    expect(pendingPolls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(pendingPolls).toHaveLength(2);
  });

  it("backs off after a failed poll", async () => {
    startLoop();
    await finishLatestPoll(false);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(pendingPolls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(pendingPolls).toHaveLength(2);
  });

  it("returns to the normal interval after a success", async () => {
    startLoop();
    await finishLatestPoll(false);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);
    await finishLatestPoll(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(pendingPolls).toHaveLength(3);
  });

  it("counts a thrown poll as a failure and keeps going", async () => {
    let pollCount = 0;
    loop = startPollingLoop({
      poll: async () => {
        pollCount += 1;
        throw new Error("network down");
      },
      intervalMs: INTERVAL_MS,
      isPageHidden: () => isPageHidden,
    });
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);
    expect(pollCount).toBe(2);
  });

  it("skips polling while the page is hidden", async () => {
    isPageHidden = true;
    startLoop();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);
    expect(pendingPolls).toHaveLength(0);
  });

  it("polls right away when asked between polls", async () => {
    const startedLoop = startLoop();
    await finishLatestPoll(true);
    startedLoop.pollNow();
    expect(pendingPolls).toHaveLength(2);
  });

  it("queues one poll when asked during a poll", async () => {
    const startedLoop = startLoop();
    startedLoop.pollNow();
    startedLoop.pollNow();
    expect(pendingPolls).toHaveLength(1);
    await finishLatestPoll(true);
    expect(pendingPolls).toHaveLength(2);
  });

  it("stops polling and signals the poll in flight", async () => {
    const startedLoop = startLoop();
    startedLoop.stop();
    expect(pendingPolls[0].stopSignal.aborted).toBe(true);
    await finishLatestPoll(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);
    expect(pendingPolls).toHaveLength(1);
  });

  it("gives up on a poll that runs past the time limit", async () => {
    startLoop();
    await vi.advanceTimersByTimeAsync(POLL_TIME_LIMIT_MS);
    expect(pendingPolls[0].stopSignal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);
    expect(pendingPolls).toHaveLength(2);
  });

  it("keeps polling after a timed-out poll finally answers", async () => {
    startLoop();
    await vi.advanceTimersByTimeAsync(POLL_TIME_LIMIT_MS);
    pendingPolls[0].resolve(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);
    expect(pendingPolls).toHaveLength(2);
    await finishLatestPoll(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(pendingPolls).toHaveLength(3);
  });

  it("runs a queued poll after a stuck poll times out", async () => {
    const startedLoop = startLoop();
    startedLoop.pollNow();
    await vi.advanceTimersByTimeAsync(POLL_TIME_LIMIT_MS);
    expect(pendingPolls).toHaveLength(2);
  });
});
