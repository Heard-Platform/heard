import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";

interface CreationSettingSheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
}

export function CreationSettingSheet({ open, title, children, onOpenChange }: CreationSettingSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-3 rounded-t-2xl px-4 pt-3 pb-4">
        <div aria-hidden="true" className="mx-auto h-1 w-9 shrink-0 rounded-full inactive-bg" />
        <SheetTitle className="creation-heading-text text-lg font-bold">{title}</SheetTitle>
        <SheetDescription className="sr-only">{title} settings for your post</SheetDescription>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <Button
          type="button"
          onClick={() => onOpenChange(false)}
          className="creation-solid-bg h-12 shrink-0 rounded-xl text-base font-bold"
        >
          Done
        </Button>
      </SheetContent>
    </Sheet>
  );
}
