import { useEffect, useState } from "react";
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
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import type { Statement } from "../../types";

interface FlagResponseDialogProps {
  statement: Statement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function FlagResponseDialog({
  statement,
  open,
  onOpenChange,
  onConfirm,
}: FlagResponseDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

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
        <div className="space-y-2">
          <Label htmlFor="flag-reason">Reason (optional)</Label>
          <Textarea
            id="flag-reason"
            placeholder="Tell us why you're reporting this response"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(reason.trim())}>
            Report
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
