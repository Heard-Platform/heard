import { useEffect, useState } from "react";
import { getDelayUntilNextShimmerMs } from "../utils/add-response-nudge";

export function useAddResponseNudge(isNudgeEligible: boolean) {
  const [shimmersShownCount, setShimmersShownCount] = useState(0);

  useEffect(() => {
    if (!isNudgeEligible) return;

    const delayUntilNextShimmerMs =
      getDelayUntilNextShimmerMs(shimmersShownCount);
    if (delayUntilNextShimmerMs === null) return;

    const shimmerTimer = setTimeout(
      () => setShimmersShownCount((count) => count + 1),
      delayUntilNextShimmerMs,
    );
    return () => clearTimeout(shimmerTimer);
  }, [isNudgeEligible, shimmersShownCount]);

  const hasShimmerToShow = isNudgeEligible && shimmersShownCount > 0;

  return { hasShimmerToShow, shimmersShownCount };
}
