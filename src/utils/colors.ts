// Light pastel color palette for statement cards
const lightPastelColors = [
  "bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100",
  "bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100",
  "bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-100",
  "bg-gradient-to-br from-rose-100 via-rose-50 to-pink-100",
  "bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100",
  "bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100",
  "bg-gradient-to-br from-cyan-100 via-cyan-50 to-teal-100",
  "bg-gradient-to-br from-teal-100 via-teal-50 to-emerald-100",
  "bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100",
  "bg-gradient-to-br from-indigo-100 via-indigo-50 to-purple-100",
  "bg-gradient-to-br from-purple-100 via-purple-50 to-fuchsia-100",
  "bg-gradient-to-br from-fuchsia-100 via-fuchsia-50 to-pink-100",
  "bg-gradient-to-br from-violet-100 via-violet-50 to-purple-100",
  "bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-100",
  "bg-gradient-to-br from-green-100 via-green-50 to-lime-100",
  "bg-gradient-to-br from-lime-100 via-lime-50 to-yellow-100",
];

// Dark pastel color palette for statement cards
const darkPastelColors = [
  "bg-gradient-to-br from-pink-900 via-pink-800 to-rose-900",
  "bg-gradient-to-br from-orange-900 via-orange-800 to-amber-900",
  "bg-gradient-to-br from-yellow-900 via-yellow-800 to-amber-900",
  "bg-gradient-to-br from-rose-900 via-rose-800 to-pink-900",
  "bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900",
  "bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900",
  "bg-gradient-to-br from-cyan-900 via-cyan-800 to-teal-900",
  "bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900",
  "bg-gradient-to-br from-sky-900 via-sky-800 to-blue-900",
  "bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900",
  "bg-gradient-to-br from-purple-900 via-purple-800 to-fuchsia-900",
  "bg-gradient-to-br from-fuchsia-900 via-fuchsia-800 to-pink-900",
  "bg-gradient-to-br from-violet-900 via-violet-800 to-purple-900",
  "bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900",
  "bg-gradient-to-br from-green-900 via-green-800 to-lime-900",
  "bg-gradient-to-br from-lime-900 via-lime-800 to-yellow-900",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Generate a consistent pastel color based on a string ID
 * Uses a simple hash to ensure the same ID always gets the same color
 */
export function getPastelColor(id: string, isDarkMode: boolean = false): string {
  const colors = isDarkMode ? darkPastelColors : lightPastelColors;
  const index = hashString(id) % colors.length;
  return colors[index];
}