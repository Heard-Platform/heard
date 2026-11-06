import type { ReactNode } from "react";
import { MessageCirclePlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";

const RESPONSE_MARK_MEANING = "An idea added by a participant";

interface ResponseMarkProps {
  className: string;
  tooltipContent?: ReactNode;
}

export function ResponseMark({
  className,
  tooltipContent = RESPONSE_MARK_MEANING,
}: ResponseMarkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex shrink-0">
          <MessageCirclePlus
            role="img"
            aria-label={RESPONSE_MARK_MEANING}
            className={className}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}