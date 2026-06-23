export const PRESET_AMOUNTS = [10, 25, 50, 100];
export const FUNDING_GOAL = 5000;
export const SHARE_URL = "https://heard.vote/fund";

export const C = {
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  emerald600: "#059669",
  emerald500: "#10b981",
  emerald300: "#6ee7b7",
  emerald100: "#d1fae5",
  emerald50: "#ecfdf5",
  teal100: "#ccfbf1",
  amber800: "#92400e",
  amber200: "#fde68a",
  amber50: "#fffbeb",
  violet500: "#8b5cf6",
  violet300: "#c4b5fd",
  violet100: "#ede9fe",
  violet50: "#f5f3ff",
  purple200: "#e9d5ff",
  purple100: "#f3e8ff",
  fuchsia100: "#fae8ff",
  indigo200: "#c7d2fe",
  indigo100: "#e0e7ff",
  blue100: "#dbeafe",
  pink200: "#fbcfe8",
  pink100: "#fce7f3",
  rose100: "#ffe4e6",
  red500: "#ef4444",
};

export function fmt(amount: number, nug: boolean) {
  if (!nug) return `$${amount.toLocaleString()}`;
  const nuggies = Math.round(amount / 0.4);
  return `🍗${nuggies.toLocaleString()}`;
}

export const styles = {
  paragraph: {
    color: C.slate600,
    lineHeight: 1.625,
    marginBottom: 16,
  },
  strong: {
    color: C.slate800
  }
};