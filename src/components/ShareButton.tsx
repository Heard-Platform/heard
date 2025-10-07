import { useState } from "react";
import { Button } from "./ui/button";
import { Share2, Check } from "lucide-react";
import { createShareableLink } from "../utils/url";
import { toast } from "sonner@2.0.3";

interface ShareButtonProps {
  roomId: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function ShareButton({
  roomId,
  variant = "outline",
  size = "sm",
  className = "",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareableLink = createShareableLink(roomId);
    const isDesktop = window.innerWidth >= 768;

    if (isDesktop) {
      // Desktop: clipboard only, no fallbacks
      try {
        await copyToClipboard(shareableLink);
      } catch (error) {
        console.error("Clipboard failed on desktop:", error);
        toast.error(
          "Could not copy link. Please manually copy the URL from your browser.",
        );
      }
      return;
    }

    // Mobile: try Web Share API first, then clipboard
    try {
      if (navigator.share) {
        // Test if Web Share API supports our data
        const shareData = {
          title: "Join my debate on HEARD!",
          text: `Join this debate and share your thoughts! ${shareableLink}`, // Include URL in text as fallback
          url: shareableLink,
        };

        // Only use canShare if it exists (it's not available on all browsers)
        if (
          !navigator.canShare ||
          navigator.canShare(shareData)
        ) {
          await navigator.share(shareData);
          return;
        }
      }
    } catch (shareError) {
      console.log(
        "Web Share API failed, using clipboard fallback:",
        shareError,
      );
    }

    // Mobile clipboard fallback
    try {
      await copyToClipboard(shareableLink);
    } catch (clipboardError) {
      console.error(
        "Clipboard failed on mobile:",
        clipboardError,
      );
      toast.error(
        "Could not copy link. Please manually copy the URL from your browser.",
      );
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={`${className} ${copied ? "bg-green-50 border-green-200 text-green-700" : ""}`}
      title="Share debate link"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </>
      )}
    </Button>
  );
}