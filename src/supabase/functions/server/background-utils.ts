declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

export function runInBackground(task: Promise<unknown>, label: string): void {
  const guarded = task.catch((error) => {
    console.error(`[Background] ${label} failed:`, error);
  });
  if (typeof EdgeRuntime !== "undefined") {
    EdgeRuntime.waitUntil(guarded);
  }
}
