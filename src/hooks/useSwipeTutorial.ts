import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "heard_swipe_count";
const REQUIRED_SWIPES = 2;

export function useSwipeTutorial() {
  const [swipeCount, setSwipeCount] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored) : 0;
  });
  const [timerTriggered, setTimerTriggered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimerTriggered(true);
      setTimeout(() => {
        setTimerTriggered(false);
      }, 5000);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const showTutorial = swipeCount < REQUIRED_SWIPES || timerTriggered;

  const recordSwipe = useCallback(() => {
    setSwipeCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const resetSwipeTutorial = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSwipeCount(0);
  }, []);

  return { showTutorial, recordSwipe, resetSwipeTutorial };
}
