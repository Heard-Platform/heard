/**
 * Displays swipe instruction text
 * Used in both the actual swipe card and the demo
 */
export function SwipeInstructions({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center text-xs text-muted-foreground ${className}`}>
      ← Swipe left to disagree, right to agree →
    </div>
  );
}
