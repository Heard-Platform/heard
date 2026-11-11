export type Poll = (stopSignal: AbortSignal) => Promise<boolean>;

export const MAXIMUM_POLL_INTERVAL_MS = 30_000;

export function getIntervalWithBackoff(
  baseMs: number,
  consecutiveFailures: number,
): number {
  if (consecutiveFailures <= 0) return baseMs;
  return Math.min(
    baseMs * 2 ** consecutiveFailures,
    MAXIMUM_POLL_INTERVAL_MS,
  );
}

export interface PollingLoopOptions {
  poll: Poll;
  intervalMs: number;
  isPageHidden: () => boolean;
}

export interface PollingLoop {
  pollNow: () => void;
  stop: () => void;
}

export function startPollingLoop({
  poll,
  intervalMs,
  isPageHidden,
}: PollingLoopOptions): PollingLoop {
  const stopController = new AbortController();
  let consecutiveFailures = 0;
  let isPolling = false;
  let isPollQueued = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function runPoll(): Promise<boolean> {
    try {
      return await poll(stopController.signal);
    } catch {
      return false;
    }
  }

  function recordOutcome(didSucceed: boolean) {
    consecutiveFailures = didSucceed ? 0 : consecutiveFailures + 1;
  }

  function scheduleNextPoll() {
    const delayMs = getIntervalWithBackoff(
      intervalMs,
      consecutiveFailures,
    );
    timer = setTimeout(tick, delayMs);
  }

  function finishTick() {
    if (stopController.signal.aborted) return;
    if (isPollQueued) {
      isPollQueued = false;
      tick();
    } else {
      scheduleNextPoll();
    }
  }

  async function tick() {
    if (stopController.signal.aborted) return;
    if (!isPageHidden()) {
      isPolling = true;
      recordOutcome(await runPoll());
      isPolling = false;
    }
    finishTick();
  }

  function pollNow() {
    if (stopController.signal.aborted) return;
    if (isPolling) {
      isPollQueued = true;
      return;
    }
    clearTimeout(timer);
    tick();
  }

  function stop() {
    stopController.abort();
    clearTimeout(timer);
  }

  tick();
  return { pollNow, stop };
}
