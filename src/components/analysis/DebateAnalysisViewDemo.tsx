import { Button } from "../ui/button";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { DebateAnalysisReportDemo } from "./DebateAnalysisReportDemo";

interface DebateAnalysisViewDemoProps {
  roomId: string;
  onClose: () => void;
  debateTopic?: string;
}

export function DebateAnalysisViewDemo({
  roomId,
  onClose,
  debateTopic = "Community Development Priorities",
}: DebateAnalysisViewDemoProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 shadow-2xl max-w-7xl h-[95vh] overflow-hidden">
        <DialogTitle className="sr-only">Conversation Analysis Demo</DialogTitle>
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="h-full overflow-y-auto bg-white">
          <DebateAnalysisReportDemo
            debateId={roomId}
            debateTopic={debateTopic}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}