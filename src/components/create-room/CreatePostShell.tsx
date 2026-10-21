import type { ComponentProps } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../ui/sheet";
import { CreatePostFrame } from "./CreatePostFrame";

interface CreatePostShellProps extends ComponentProps<typeof CreatePostFrame> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostShell({ open, onOpenChange, title, ...frameProps }: CreatePostShellProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[calc(100dvh-0.75rem)] gap-0 overflow-hidden rounded-t-[20px] border-0 p-0 [&>button:last-child]:hidden"
      >
        <SheetTitle className="sr-only">{title || "Create a post"}</SheetTitle>
        <SheetDescription className="sr-only">Create a post people can vote on</SheetDescription>
        <CreatePostFrame title={title} onClose={() => onOpenChange(false)} {...frameProps} />
      </SheetContent>
    </Sheet>
  );
}
