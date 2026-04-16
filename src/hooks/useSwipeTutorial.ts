import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "heard_swipe_count";
const REQUIRED_SWIPES = 2;
const REMINDER_INTERVAL_MS = 10000;
const REMINDER_SHOW_MS = 5000;

type TimerState = "uninitiated" | "waiting" | "showing";

export function useSwipeTutorial() {
  const [swipeCount, setSwipeCount] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored) : 0;
  });
  const [timerState, setTimerState] = useState<TimerState>("uninitiated");

  useEffect(() => {
    if (swipeCount >= REQUIRED_SWIPES && timerState === "uninitiated") {
      setTimerState("waiting");
    }
  }, [swipeCount, timerState]);

  useEffect(() => {
    if (timerState === "waiting") {
      const timer = setTimeout(
        () => setTimerState("showing"),
        REMINDER_INTERVAL_MS,
      );
      return () => clearTimeout(timer);
    } else if (timerState === "showing") {
      const timer = setTimeout(
        () => setTimerState("waiting"),
        REMINDER_SHOW_MS,
      );
      return () => clearTimeout(timer);
    }
  }, [timerState]);

  const showTutorial =
    swipeCount < REQUIRED_SWIPES || timerState === "showing";

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
    setTimerState("uninitiated");
  }, []);

  return { showTutorial, recordSwipe, resetSwipeTutorial };
}
