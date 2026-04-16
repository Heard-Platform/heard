import { useState, useCallback, useEffect, useRef } from "react";

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startWaiting = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimerState("waiting");
    timerRef.current = setTimeout(() => {
      setTimerState("showing");
      timerRef.current = setTimeout(() => {
        setTimerState("waiting");
        startWaiting();
      }, REMINDER_SHOW_MS);
    }, REMINDER_INTERVAL_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (swipeCount >= REQUIRED_SWIPES && timerState === "uninitiated") {
      startWaiting();
    }
  }, [swipeCount, startWaiting]);

  const showTutorial =
    swipeCount < REQUIRED_SWIPES || timerState === "showing";

  const recordSwipe = useCallback(() => {
    setSwipeCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const resetTutorialTimer = useCallback(() => {
    if (timerRef.current !== null) {
      startWaiting();
    }
  }, [startWaiting]);

  const resetSwipeTutorial = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setSwipeCount(0);
    setTimerState("uninitiated");
  }, []);

  return { showTutorial, recordSwipe, resetTutorialTimer, resetSwipeTutorial };
}
