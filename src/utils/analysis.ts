export const scoreToWord = (score: number) => {
  if (score >= 0.9) return "Rockin' it 🏆";
  if (score >= 0.75) return "Great 👍";
  if (score >= 0.5) return "Good";
  if (score >= 0.25) return "Needs some love 🙁";
  if (score > 0) return "Barely any";
  return "None 😭";
};