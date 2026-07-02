import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../utils/api";
import type { ApiResponse } from "../utils/api-client";
import { safelyGetStorageItem, safelySetStorageItem } from "../utils/localStorage";
import { FUNDING_GOAL, fmt } from "../screens/funding/constants";

const DISMISSED_KEY = "funding_teaser_dismissed";

interface FundingTeaserProps {
  getFundingStats?: () => Promise<ApiResponse<{ totalDollars: number; donorCount: number }>>;
}

export function FundingTeaser({
  getFundingStats = () => api.getFundingStats(),
}: FundingTeaserProps) {
  const [totalDonated, setTotalDonated] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(() =>
    safelyGetStorageItem(DISMISSED_KEY, false),
  );

  useEffect(() => {
    if (dismissed) return;
    getFundingStats().then((res) => {
      if (res.success && res.data) {
        setTotalDonated(res.data.totalDollars);
      }
    });
  }, []);

  if (dismissed || totalDonated === null) return null;

  const progressPct = Math.min((totalDonated / FUNDING_GOAL) * 100, 100);

  const handleClick = () => {
    api.trackEvent("funding_teaser_clicked");
    window.location.href = "/fund";
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    api.trackEvent("funding_teaser_dismissed");
    safelySetStorageItem(DISMISSED_KEY, true);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 left-4 right-4 controls-layer flex justify-center pointer-events-none"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: [0, -6, 0], opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{
          y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.3 },
        }}
      >
        <div
          onClick={handleClick}
          className="pointer-events-auto w-full max-w-[380px] cursor-pointer rounded-2xl border border-violet-100 bg-white p-3 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-slate-900">
              🐒 Fund Heard for the 4th!
            </p>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="-mr-1 -mt-1 shrink-0 rounded-full px-2 text-lg leading-none text-slate-300 hover:text-slate-500"
            >
              ×
            </button>
          </div>
          <p className="mb-2 text-xs text-slate-500">
            We're raising {fmt(FUNDING_GOAL, false)} by July 4th to pay for flyer printer paper, website costs, and frozen dinners for the founder. Please consider helping us hit our goal!
          </p>
          <div className="mb-1 flex justify-between text-xs font-semibold">
            <span className="text-emerald-600">
              {fmt(totalDonated, false)} raised
            </span>
            <span className="text-slate-400">
              {fmt(FUNDING_GOAL, false)} goal
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
