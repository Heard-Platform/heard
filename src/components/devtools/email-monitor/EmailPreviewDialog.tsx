import type { SentEmail } from "../../../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

interface EmailPreviewDialogProps {
  item: SentEmail | null;
  onClose: () => void;
}

export function EmailPreviewDialog({ item, onClose }: EmailPreviewDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95%]">
        <DialogHeader>
          <DialogTitle>{item?.previewSubject}</DialogTitle>
          <DialogDescription>
            {item?.recipientEmail} &middot; {item?.template}
          </DialogDescription>
        </DialogHeader>
        {item?.previewHtml && (
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={item.previewHtml}
              title="Email Preview"
              className="w-full h-[600px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
