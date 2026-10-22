import type { ReactNode } from "react";

const PROJECTOR_WIDTH_PX = 1920;
const PROJECTOR_HEIGHT_PX = 1080;

export function ProjectorFrame({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[1280px]">
      <p className="text-xs font-semibold text-slate-500 mb-1">
        Projector, {PROJECTOR_WIDTH_PX}×{PROJECTOR_HEIGHT_PX}, scaled to fit
      </p>
      <div className="display-screen-bg @container relative aspect-video w-full overflow-hidden rounded-2xl border">
        {children}
      </div>
    </div>
  );
}
