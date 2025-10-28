import { useState } from "react";
import { Button } from "./ui/button";
import { Share2, Check } from "lucide-react";
import { createShareableLink } from "../utils/url";
import { toast } from "sonner@2.0.3";
import { share } from "../utils/share";

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

  const handleShare = async () => {
    const shareableLink = createShareableLink(roomId);
    
    await share({
      title: "Join my debate on HEARD!",
      text: "Join this debate and share your thoughts!",
      url: shareableLink,
      onSuccess: () => {
        setCopied(true);
        toast.success("Share link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      },
      onError: (error) => {
        toast.error(
          "Could not copy link. Please manually copy the URL from your browser.",
        );
      },
    });
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