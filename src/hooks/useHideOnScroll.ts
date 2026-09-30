import { useCallback, useRef, useState } from "react";

const DIRECTION_CHANGE_THRESHOLD_PX = 6;

export function useHideOnScroll(revealZonePx: number) {
  const [hidden, setHidden] = useState(false);
  const lastScrollTopRef = useRef(0);

  const handleScroll = useCallback(
    (scrollTop: number) => {
      const delta = scrollTop - lastScrollTopRef.current;
      if (scrollTop <= revealZonePx) {
        setHidden(false);
      } else if (delta > DIRECTION_CHANGE_THRESHOLD_PX) {
        setHidden(true);
      } else if (delta < -DIRECTION_CHANGE_THRESHOLD_PX) {
        setHidden(false);
      } else {
        return;
      }
      lastScrollTopRef.current = scrollTop;
    },
    [revealZonePx],
  );

  return { hidden, handleScroll };
}
