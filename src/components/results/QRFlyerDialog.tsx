import { useState } from "react";
import { QrCode, Link as LinkIcon, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { QRCodeSVG } from "qrcode.react";
import type { Statement } from "../../types";

interface QRFlyerDialogProps {
  statement: Statement;
  isOpen: boolean;
  onClose: () => void;
}

export function QRFlyerDialog({
  statement,
  isOpen,
  onClose,
}: QRFlyerDialogProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const flyerId = statement.roomId;

  const voteOptions = [
    { vote: "agree", label: "Agree", color: "bg-green-500", textColor: "text-green-700" },
    { vote: "disagree", label: "Disagree", color: "bg-red-500", textColor: "text-red-700" },
    { vote: "pass", label: "Unsure", color: "bg-gray-500", textColor: "text-gray-700" },
  ] as const;

  const getFlyerUrl = (vote: string) => {
    return `${baseUrl}/flyer/${flyerId}/${statement.id}/${vote}`;
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <QrCode className="w-5 h-5" />
            QR Code Flyer Links
          </DialogTitle>
          <DialogDescription>
            Share these QR codes to let people vote on this statement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
            <p className="text-sm leading-relaxed text-gray-900">
              {statement.text}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {voteOptions.map(({ vote, label, color, textColor }) => {
              const url = getFlyerUrl(vote);
              const isCopied = copiedUrl === url;

              return (
                <div
                  key={vote}
                  className="p-4 border-2 border-gray-200 rounded-xl bg-white space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge className={`${color} text-white`}>{label}</Badge>
                  </div>

                  <div className="flex justify-center bg-white p-4 rounded-lg border">
                    <QRCodeSVG value={url} size={160} level="M" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs text-gray-600 break-all">
                      <LinkIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="break-all">{url}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleCopyUrl(url)}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-xs text-gray-500 text-center">
            When someone scans a QR code, they'll be taken directly to the voting results.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}