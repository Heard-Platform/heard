// Pastel color palette for statement cards
const pastelColors = [
  // Warm pastels
  "bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100",
  "bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100",
  "bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-100",
  "bg-gradient-to-br from-rose-100 via-rose-50 to-pink-100",
  "bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100",
  
  // Cool pastels
  "bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100",
  "bg-gradient-to-br from-cyan-100 via-cyan-50 to-teal-100",
  "bg-gradient-to-br from-teal-100 via-teal-50 to-emerald-100",
  "bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100",
  "bg-gradient-to-br from-indigo-100 via-indigo-50 to-purple-100",
  
  // Purple/Pink pastels
  "bg-gradient-to-br from-purple-100 via-purple-50 to-fuchsia-100",
  "bg-gradient-to-br from-fuchsia-100 via-fuchsia-50 to-pink-100",
  "bg-gradient-to-br from-violet-100 via-violet-50 to-purple-100",
  
  // Green pastels
  "bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-100",
  "bg-gradient-to-br from-green-100 via-green-50 to-lime-100",
  "bg-gradient-to-br from-lime-100 via-lime-50 to-yellow-100",
];

/**
 * Generate a consistent pastel color based on a string ID
 * Uses a simple hash to ensure the same ID always gets the same color
 */
export function getPastelColor(id: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Get absolute value and map to array index
  const index = Math.abs(hash) % pastelColors.length;
  return pastelColors[index];
}
