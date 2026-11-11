export type Poll = (stopSignal: AbortSignal) => Promise<boolean>;

export const MAXIMUM_POLL_INTERVAL_MS = 30_000;
export const POLL_TIME_LIMIT_MS = 15_000;

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

function waitForAbort(signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    signal.addEventListener("abort", () => resolve(false), {
      once: true,
    });
  });
}

export function startPollingLoop({
  poll,
  intervalMs,
  isPageHidden,
}: PollingLoopOptions): PollingLoop {
  let isStopped = false;
  let consecutiveFailures = 0;
  let isPollQueued = false;
  let currentPollController: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function runPoll(): Promise<boolean> {
    const pollController = new AbortController();
    currentPollController = pollController;
    const timeLimitTimer = setTimeout(
      () => pollController.abort(),
      POLL_TIME_LIMIT_MS,
    );
    try {
      return await Promise.race([
        poll(pollController.signal),
        waitForAbort(pollController.signal),
      ]);
    } catch {
      return false;
    } finally {
      clearTimeout(timeLimitTimer);
      currentPollController = null;
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
    if (isStopped) return;
    if (isPollQueued) {
      isPollQueued = false;
      tick();
    } else {
      scheduleNextPoll();
    }
  }

  async function tick() {
    if (isStopped) return;
    if (!isPageHidden()) recordOutcome(await runPoll());
    finishTick();
  }

  function pollNow() {
    if (isStopped) return;
    if (currentPollController) {
      isPollQueued = true;
      return;
    }
    clearTimeout(timer);
    tick();
  }

  function stop() {
    isStopped = true;
    clearTimeout(timer);
    currentPollController?.abort();
  }

  tick();
  return { pollNow, stop };
}
