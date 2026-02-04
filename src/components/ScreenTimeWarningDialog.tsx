import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { AlertTriangle } from "lucide-react";

interface ScreenTimeWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TITLE = "Screen Time Warning ⏰";
const DESCRIPTION = "Hey! Just a heads up, the time limit you set has been reached. Taking breaks helps keep the conversation fun and healthy!";

export function ScreenTimeWarningDialog({
  isOpen,
  onClose,
}: ScreenTimeWarningDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 shadow-2xl max-w-md overflow-hidden">
        <DialogTitle className="sr-only">{TITLE}</DialogTitle>
        <DialogDescription className="sr-only">
          {DESCRIPTION}
        </DialogDescription>
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 pt-8 pb-6 px-6">
          <div className="flex justify-center">
            <AlertTriangle className="w-20 h-20 text-white drop-shadow-2xl" />
          </div>
        </div>
        <div className="p-6 space-y-4 bg-white">
          <h2 className="text-center text-xl text-gray-900">
            {TITLE}
          </h2>
          <p className="text-center text-sm text-gray-600 leading-relaxed">
            {DESCRIPTION}
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full hover:from-green-500 hover:to-emerald-600 transition-all shadow-md"
          >
            Got It! 👍
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}