export interface ChartPointerState {
  activeLabel?: string | number;
}

export function chartPointerTime(state: ChartPointerState | null | undefined): number | null {
  const time = Number(state?.activeLabel);
  return Number.isFinite(time) ? time : null;
}
