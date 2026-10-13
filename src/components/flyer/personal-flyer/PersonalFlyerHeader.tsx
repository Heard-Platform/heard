import { ChevronLeft } from "lucide-react";
import { COLORS } from "./personal-flyer-theme";

const LOGO_SRC = "/monkey.png";

export function PersonalFlyerHeader({ onBack }: { onBack?: () => void }) {
  return (
    <div className={`flex items-center ${onBack ? "justify-between" : "justify-start"}`}>
      {onBack && (
        <button
          className="-ml-1 flex items-center gap-1 text-sm"
          style={{ color: COLORS.ink }}
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      )}
      <div className="flex items-center gap-1">
        <img src={LOGO_SRC} alt="" className="h-4 w-4" />
        <span className="text-xl font-extrabold leading-none tracking-tight" style={{ color: COLORS.ink }}>
          heard
        </span>
      </div>
    </div>
  );
}
