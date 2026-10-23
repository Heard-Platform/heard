export function sleep(durationMs: number, stopSignal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (stopSignal?.aborted) return resolve();
    const timer = setTimeout(finish, durationMs);
    stopSignal?.addEventListener("abort", finish, { once: true });

    function finish() {
      clearTimeout(timer);
      stopSignal?.removeEventListener("abort", finish);
      resolve();
    }
  });
}
