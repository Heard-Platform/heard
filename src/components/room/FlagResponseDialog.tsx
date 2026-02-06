import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import type { Statement } from "../../types";

interface FlagResponseDialogProps {
  statement: Statement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function FlagResponseDialog({
  open,
  onOpenChange,
  statement,
  onConfirm,
}: FlagResponseDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report this response?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="p-3 bg-muted rounded-md text-foreground">
              "{statement?.text}"
            </div>
            <div>
              This will flag the response for our team to review and skip it
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Report
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}