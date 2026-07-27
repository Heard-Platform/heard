export const scoreToWordKey = (score: number) => {
  if (score >= 0.9) return "vibeRockin";
  if (score >= 0.75) return "vibeGreat";
  if (score >= 0.5) return "vibeGood";
  if (score >= 0.25) return "vibeNeedsLove";
  if (score > 0) return "vibeBarely";
  return "vibeNone";
};