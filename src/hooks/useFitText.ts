import { useLayoutEffect, useRef, useState } from "react";

// Shrinks text 1px at a time from maxPx until it fits its box (which must have a bounded height),
// stopping at minPx.
export function useFitText<T extends HTMLElement>(text: string, maxPx: number, minPx: number) {
  const ref = useRef<T>(null);
  const [fontSize, setFontSize] = useState(maxPx);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    let size = maxPx;
    element.style.fontSize = `${size}px`;
    while (size > minPx && element.scrollHeight > element.clientHeight) {
      size -= 1;
      element.style.fontSize = `${size}px`;
    }
    setFontSize(size);
  }, [text, maxPx, minPx]);

  return { ref, fontSize };
}
