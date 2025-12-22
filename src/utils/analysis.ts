export const scoreToWord = (score: number) => {
  if (score >= 0.9) return "Very High";
  if (score >= 0.75) return "High";
  if (score >= 0.5) return "Moderate";
  if (score >= 0.25) return "Low";
  return "Very Low";
};