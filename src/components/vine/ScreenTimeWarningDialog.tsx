import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ScreenTimeWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScreenTimeWarningDialog({
  isOpen,
  onClose,
}: ScreenTimeWarningDialogProps) {
  const { t } = useTranslation("vine");
  const title = t("vineStTitle");
  const description = t("vineStBody");
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 shadow-2xl max-w-md overflow-hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {description}
        </DialogDescription>
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 pt-8 pb-6 px-6">
          <div className="flex justify-center">
            <AlertTriangle className="w-20 h-20 text-white drop-shadow-2xl" />
          </div>
        </div>
        <div className="p-6 space-y-4 bg-white">
          <h2 className="text-center text-xl text-gray-900">
            {title}
          </h2>
          <p className="text-center text-sm text-gray-600 leading-relaxed">
            {description}
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full hover:from-green-500 hover:to-emerald-600 transition-all shadow-md"
          >
            {t("vineStGotIt")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}