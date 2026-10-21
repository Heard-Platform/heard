import type { ReactNode } from "react";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "../ui/button";

export type CreatePostTone = "default" | "success";

interface CreatePostFrameProps {
  title?: string;
  tone?: CreatePostTone;
  children: ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  onTitleClick?: () => void;
}

export function CreatePostFrame({ title, tone = "default", children, onBack, onClose, onTitleClick }: CreatePostFrameProps) {
  return (
    <div className={`flex h-full min-h-0 flex-col px-4 pb-3 ${tone === "success" ? "creation-tint-bg" : "bg-white"}`}>
      <div className="flex h-12 shrink-0 items-center gap-2 pt-1">
        {onBack && (
          <Button type="button" variant="ghost" aria-label="Back" onClick={onBack} className="-ml-2 size-11 p-0">
            <ChevronLeft className="size-6" />
          </Button>
        )}
        <h2
          onClick={onTitleClick}
          className={`creation-heading-text min-w-0 flex-1 truncate font-bold ${
            onBack ? "text-center text-lg" : "text-[22px] tracking-tight"
          }`}
        >
          {title}
        </h2>
        {onClose ? (
          <Button type="button" variant="ghost" aria-label="Close" onClick={onClose} className="-mr-2 size-11 p-0">
            <X className="size-5" />
          </Button>
        ) : (
          onBack && <div aria-hidden="true" className="size-11" />
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
