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

interface FlagStatementDialogProps {
  statement: Statement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function FlagStatementDialog({
  open,
  onOpenChange,
  statement,
  onConfirm,
}: FlagStatementDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report this statement?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="p-3 bg-muted rounded-md text-foreground">
              "{statement?.text}"
            </div>
            <div>
              This will flag the statement for our team to review. The statement will be skipped in your voting.
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