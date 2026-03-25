import { useState, useCallback } from "react";

const STORAGE_KEY = "heard_swipe_count";
const REQUIRED_SWIPES = 2;

export function useSwipeTutorial() {
  const [swipeCount, setSwipeCount] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });

  const showTutorial = swipeCount < REQUIRED_SWIPES;

  const recordSwipe = useCallback(() => {
    setSwipeCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { showTutorial, recordSwipe };
}
