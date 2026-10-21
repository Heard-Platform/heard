import { useState } from "react";
// @ts-ignore
import { toast } from "sonner@2.0.3";
import { Check, Copy, Share } from "lucide-react";
import { Button } from "../ui/button";
import { api } from "../../utils/api";
import { createShareableLink } from "../../utils/url";
import { share } from "../../utils/share";

const COPIED_RESET_MS = 2000;

interface CreationSuccessStepProps {
  debateId: string;
  topic: string;
  onViewPost: () => void;
}

export function CreationSuccessStep({ debateId, topic, onViewPost }: CreationSuccessStepProps) {
  const [copied, setCopied] = useState(false);
  const shareLink = createShareableLink(debateId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      api.trackEvent("create_room_link_copied", debateId);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch (error) {
      toast.error("Failed to copy link");
      console.error("Copy error:", error);
    }
  };

  const handleShare = () =>
    share({
      url: shareLink,
      title: "Join this conversation on Heard",
      text: `Check out this conversation: "${topic}"`,
      onSuccess: () => {
        api.trackEvent("create_room_link_shared", debateId);
        toast.success("Link shared!");
      },
      onError: (error) => {
        toast.error("Failed to share link");
        console.error("Share error:", error);
      },
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pt-2">
      <div className="creation-solid-bg mx-auto flex size-[72px] shrink-0 items-center justify-center rounded-full">
        <Check aria-hidden="true" className="size-9" strokeWidth={2.6} />
      </div>
      <div className="space-y-1.5 text-center">
        <h3 className="creation-heading-text text-[28px] leading-tight font-extrabold tracking-tight">Your post is live</h3>
        <p className="creation-strong-text text-[15px] leading-snug">
          Now send it to your peeps! Anyone with the link can participate.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="post-link" className="sr-only">
          Post link
        </label>
        <input
          id="post-link"
          readOnly
          value={shareLink}
          onFocus={(e) => e.currentTarget.select()}
          className="creation-soft-border h-12 min-w-0 flex-1 rounded-xl border-[1.5px] bg-white px-3 font-mono text-sm text-foreground outline-none"
        />
        <Button
          type="button"
          variant="outline"
          aria-label={copied ? "Link copied" : "Copy link"}
          onClick={handleCopy}
          className="creation-soft-border creation-strong-text size-12 shrink-0 rounded-xl border-[1.5px] bg-white p-0"
        >
          {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
        </Button>
      </div>

      <Button type="button" onClick={handleShare} className="creation-solid-bg h-13 shrink-0 rounded-2xl text-[17px] font-bold">
        <Share className="size-5" />
        Share
      </Button>

      <button
        type="button"
        onClick={onViewPost}
        className="creation-strong-text mx-auto min-h-11 text-[15px] font-semibold underline underline-offset-4"
      >
        View your post
      </button>
    </div>
  );
}
