import { useEffect } from "react";
import { Share2 } from "lucide-react";
import { Button } from "../ui/button";
import { api } from "../../utils/api";
import { share } from "../../utils/share";
import { createReferralLink } from "../../utils/url";
import type { DebateRoom } from "../../types";
// @ts-ignore
import { toast } from "sonner@2.0.3";

interface ShareCardProps {
  room: DebateRoom;
  currentUserId?: string;
  isTopCard: boolean;
  onInvite: () => void;
}

export function ShareCard({
  room,
  currentUserId,
  isTopCard,
  onInvite,
}: ShareCardProps) {
  useEffect(() => {
    if (isTopCard) {
      api.trackEvent("share_card_shown", room.id);
    }
  }, [isTopCard, room.id]);

  const handleInvite = async () => {
    const link = currentUserId
      ? createReferralLink(room.id, currentUserId)
      : `${window.location.origin}/room/${room.id}`;

    api.trackEvent("share_card_shared", room.id);

    await share({
      url: link,
      title: `Where do you land on "${room.topic}"?`,
      text: `I just weighed in on "${room.topic}" — curious if you'd agree with me. See where you land: ${link}`,
      onSuccess: () => {
        toast.success("Invite link copied! Send it to a friend 🔮");
        onInvite();
      },
      onError: () => {
        toast.error("Failed to create invite link");
      },
    });
  };

  return (
    <>
      <div className="mb-4 min-h-[120px] flex flex-col items-center justify-center space-y-4 text-center">
        <div className="text-3xl mb-2">👯</div>
        <h3 className="text-2xl">Where do your friends land?</h3>
        <p className="text-base text-muted-foreground max-w-sm">
          Send this conversation to your friends to get more voices weighing in
        </p>
        <Button
          className="heard-pill share-bg hover:share-bg-hover normal-text"
          onClick={handleInvite}
        >
          <Share2 className="w-4 h-4" />
          Invite a friend to vote
        </Button>
      </div>

      {isTopCard && (
        <div className="pt-2 border-t share-border">
          <p className="text-xs text-center share-text">
            Swipe away to continue
          </p>
        </div>
      )}
    </>
  );
}
