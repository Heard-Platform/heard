import { Button } from "./ui/button";
import { Link2 } from "lucide-react";
import { createShareableLink } from "../utils/url";
import { share } from "../utils/share";
import { toast } from "sonner@2.0.3";

interface ShareButtonProps {
  roomId: string;
}

export function ShareButton({ roomId }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = createShareableLink(roomId);
    
    await share({
      url: link,
      title: "Join this debate on Heard",
      text: "Check out this debate!",
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
      variant="ghost"
      size="icon"
      className="w-6 h-6 text-gray-400 hover:text-purple-600 hover:bg-purple-50 p-0"
      onClick={handleShare}
    >
      <Link2 className="w-4 h-4" />
    </Button>
  );
}