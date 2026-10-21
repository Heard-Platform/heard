import type { ReactNode } from "react";
import { Check, ChevronDown, Clock, Hash, Image as ImageIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { formatSubHeardDisplay } from "../../utils/subheard";
import { formatDebateLengthShort } from "./create-post-utils";

export type CreationSetting = "community" | "cover" | "length" | "advanced";

interface CreationSettingsPanelProps {
  subHeard: string;
  hideCommunity?: boolean;
  hasCover: boolean;
  debateLength: number;
  advancedCount: number;
  advancedIncomplete?: boolean;
  onOpenSetting: (setting: CreationSetting) => void;
}

const SET_CLASSES = "creation-accent-border creation-tint-bg creation-strong-text border-[1.5px]";
const UNSET_CLASSES = "normal-border bg-white text-foreground";
const ATTENTION_CLASSES = "attention-border attention-bg attention-text border-[1.5px]";

function SetBadge({ children, attention = false }: { children: ReactNode; attention?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`${attention ? "attention-solid-bg" : "creation-solid-bg"} absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-extrabold`}
    >
      {children}
    </span>
  );
}

export function CreationSettingsPanel({
  subHeard,
  hideCommunity = false,
  hasCover,
  debateLength,
  advancedCount,
  advancedIncomplete = false,
  onOpenSetting,
}: CreationSettingsPanelProps) {
  const lengthLabel = formatDebateLengthShort(debateLength);
  const advancedClasses = advancedIncomplete ? ATTENTION_CLASSES : advancedCount > 0 ? SET_CLASSES : UNSET_CLASSES;
  const advancedLabel = advancedIncomplete
    ? "Advanced settings: finish your custom question"
    : advancedCount > 0
      ? `Advanced settings: ${advancedCount} set`
      : "Advanced settings";

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {!hideCommunity &&
        (subHeard ? (
          <Button
            type="button"
            variant="outline"
            aria-label={`Community: ${formatSubHeardDisplay(subHeard)}`}
            onClick={() => onOpenSetting("community")}
            className={`h-11 min-w-0 flex-1 justify-start gap-1.5 rounded-xl px-2.5 text-[15px] font-semibold ${UNSET_CLASSES}`}
          >
            <Hash className="size-[18px] shrink-0" />
            <span className="truncate">{formatSubHeardDisplay(subHeard)}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenSetting("community")}
            className="attention-border attention-bg attention-text h-11 min-w-0 flex-1 justify-start gap-1.5 rounded-xl border-[1.5px] border-dashed px-2.5 text-[15px] font-semibold"
          >
            <Hash className="size-[18px] shrink-0" />
            <span className="truncate">Pick community</span>
            <ChevronDown className="ml-auto size-3.5 shrink-0" />
          </Button>
        ))}
      {hideCommunity && <div className="flex-1" />}

      <Button
        type="button"
        variant="outline"
        aria-label={hasCover ? "Cover card: set" : "Cover card: none"}
        onClick={() => onOpenSetting("cover")}
        className={`relative size-11 shrink-0 rounded-xl p-0 ${hasCover ? SET_CLASSES : UNSET_CLASSES}`}
      >
        <ImageIcon className="size-5" />
        {hasCover && (
          <SetBadge>
            <Check className="size-2.5" strokeWidth={4} />
          </SetBadge>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        aria-label={`Length: ${lengthLabel}`}
        onClick={() => onOpenSetting("length")}
        className={`h-11 shrink-0 gap-1 rounded-xl px-2.5 text-sm font-semibold ${UNSET_CLASSES}`}
      >
        <Clock className="size-[18px]" />
        {lengthLabel}
      </Button>

      <Button
        type="button"
        variant="outline"
        aria-label={advancedLabel}
        onClick={() => onOpenSetting("advanced")}
        className={`relative size-11 shrink-0 rounded-xl p-0 ${advancedClasses}`}
      >
        <SlidersHorizontal className="size-5" />
        {advancedIncomplete ? (
          <SetBadge attention>!</SetBadge>
        ) : (
          advancedCount > 0 && <SetBadge>{advancedCount}</SetBadge>
        )}
      </Button>
    </div>
  );
}
