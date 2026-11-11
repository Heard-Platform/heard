import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startPollingLoop, type PollingLoop } from "./polling-loop";

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
});
