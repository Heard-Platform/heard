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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["dialog", "common"]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("flagTitle")}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="p-3 bg-muted rounded-md text-foreground">
              "{statement?.text}"
            </div>
            <div>
              {t("flagDescription")}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="flag-reason">{t("flagReasonLabel")}</Label>
          <Textarea
            id="flag-reason"
            placeholder={t("flagReasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("common:cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(reason.trim())}>
            {t("flagConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
