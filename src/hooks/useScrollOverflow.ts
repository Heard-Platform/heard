import { useCallback, useLayoutEffect, useRef, useState } from "react";

const SUBPIXEL_TOLERANCE_PX = 1;

export function useScrollOverflow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [hasContentBelow, setHasContentBelow] = useState(false);

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const distanceFromBottom =
      element.scrollHeight - element.clientHeight - element.scrollTop;
    setHasContentBelow(distanceFromBottom > SUBPIXEL_TOLERANCE_PX);
  }, []);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    measure();
    element.addEventListener("scroll", measure, { passive: true });
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    Array.from(element.children).forEach((child) => resizeObserver.observe(child));

    return () => {
      element.removeEventListener("scroll", measure);
      resizeObserver.disconnect();
    };
  }, [measure]);

  return { ref, hasContentBelow };
}
