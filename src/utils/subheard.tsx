/**
 * Normalize a subheard name to the standard format
 * (lowercase, spaces replaced with hyphens)
 */
export function normalizeSubHeardName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Format a subheard name for display
 * (capitalize each word, replace hyphens with spaces)
 */
export function formatSubHeardDisplay(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
