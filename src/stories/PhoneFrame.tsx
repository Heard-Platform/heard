import type { ReactNode } from "react";

const PHONE_WIDTH_PX = 375;
const PHONE_HEIGHT_PX = 560;

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-1">
        Phone, {PHONE_WIDTH_PX}×{PHONE_HEIGHT_PX}
      </p>
      <div
        className="heard-feed-bg flex flex-col rounded-2xl border overflow-y-auto"
        style={{ width: PHONE_WIDTH_PX, height: PHONE_HEIGHT_PX }}
      >
        {children}
      </div>
    </div>
  );
}
