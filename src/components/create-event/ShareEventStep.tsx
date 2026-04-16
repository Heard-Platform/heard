// @ts-ignore
import { toast } from "sonner@2.0.3";
import { Check, Share2, Clipboard } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { createShareableEventLink } from "../../utils/url";
import { share } from "../../utils/share";

interface ShareEventStepProps {
  eventId: string;
  eventName: string;
}

export function ShareEventStep({ eventId, eventName }: ShareEventStepProps) {
  const [copied, setCopied] = useState(false);

  const shareLink = createShareableEventLink(eventId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
      console.error("Copy error:", error);
    }
  };

  const handleShare = async () => {
    await share({
      url: shareLink,
      title: `Join this event on Heard`,
      text: `Check out this event: "${eventName}"`,
      onSuccess: () => toast.success("Link shared!"),
      onError: (error) => {
        toast.error("Failed to share link");
        console.error("Share error:", error);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h3 className="font-medium text-lg text-orange-900">
            Event Created! 🎉
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Share it with people you want to join
          </p>
        </div>
      </div>

      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
        <p className="text-xs text-orange-700 mb-2 font-medium">
          Shareable Link
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-white px-3 py-2 rounded border border-orange-200">
            <p className="text-sm text-orange-900 font-mono truncate">
              {shareLink}
            </p>
          </div>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="icon"
            className="flex-shrink-0 border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Clipboard className="w-4 h-4 text-orange-600" />
            )}
          </Button>
          <Button
            onClick={handleShare}
            size="icon"
            className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
