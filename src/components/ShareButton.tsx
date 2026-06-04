// @ts-ignore
import { toast } from "sonner@2.0.3";

import { Button } from "./ui/button";
import { Share } from "lucide-react";
import { createShareableLink } from "../utils/url";
import { share } from "../utils/share";

interface ShareButtonProps {
  roomId: string;
}

export function ShareButton({ roomId }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = createShareableLink(roomId);

    await share({
      url: link,
      title: "Join this conversation on Heard",
      text: "Check out this conversation!",
      onSuccess: () => {
        toast.success("Link copied to clipboard!");
      },
      onError: (error) => {
        toast.error("Failed to share link");
        console.error("Share error:", error);
      },
    });
  };

  return (
    <Button
      variant="secondary"
      className="heard-pill hover:bg-secondary/60"
      onClick={handleShare}
    >
      <Share className="w-4 h-4" />
    </Button>
  );
}