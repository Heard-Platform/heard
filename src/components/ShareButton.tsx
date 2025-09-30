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
  className = ""
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareableLink = createShareableLink(roomId);
    
    // Detect if we're on a desktop device (screen width >= 768px)
    const isDesktop = window.innerWidth >= 768;
    
    // On desktop, always use clipboard first for better UX
    if (isDesktop) {
      try {
        await navigator.clipboard.writeText(shareableLink);
        setCopied(true);
        toast.success("Share link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (clipboardError) {
        console.error("Clipboard failed on desktop:", clipboardError);
        // Fall through to other methods
      }
    } else {
      // On mobile, try Web Share API first
      try {
        if (navigator.share && navigator.canShare && navigator.canShare({
          title: "Join my debate on HEARD!",
          text: "Join this debate and share your thoughts!",
          url: shareableLink,
        })) {
          await navigator.share({
            title: "Join my debate on HEARD!",
            text: "Join this debate and share your thoughts!",
            url: shareableLink,
          });
          return;
        }
      } catch (shareError) {
        console.log("Web Share API failed, using clipboard fallback");
      }
    }
    
    // Fallback to clipboard for both desktop and mobile
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (clipboardError) {
      console.error("Error copying to clipboard:", clipboardError);
      
      // Final fallback - create a temporary text area for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareableLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopied(true);
        toast.success("Share link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (finalError) {
        console.error("All copy methods failed:", finalError);
        toast.error("Could not copy link. Please manually copy the URL from your browser.");
      }
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