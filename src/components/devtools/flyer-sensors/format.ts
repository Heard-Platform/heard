export function formatClockTime(timeMs: number): string {
  return new Date(timeMs).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}
