// @ts-ignore
import { toast } from "sonner@2.0.3";

import { Check, Share2, Clipboard } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { createShareableLink } from "../../utils/url";
import { share } from "../../utils/share";
import { useTranslation } from "react-i18next";

interface ShareDebateStepProps {
  debateId: string | null;
  topic: string;
}

export function ShareDebateStep({ debateId, topic }: ShareDebateStepProps) {
  const { t } = useTranslation(["create", "toast"]);
  const [copied, setCopied] = useState(false);

  if (!debateId) {
    return <div>{t("noPostId")}</div>;
  }
  
  const shareLink = createShareableLink(debateId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success(t("toast:linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t("toast:copyLinkFailed"));
      console.error("Copy error:", error);
    }
  };

  const handleShare = async () => {
    await share({
      url: shareLink,
      title: t("shareInviteTitle"),
      text: t("shareInviteText", { topic }),
      onSuccess: () => {
        toast.success(t("toast:linkShared"));
      },
      onError: (error) => {
        toast.error(t("toast:shareLinkFailed"));
        console.error("Share error:", error);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Success message */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="font-medium text-lg text-green-900">
            {t("conversationCreated")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("shareWithFriends")}
          </p>
        </div>
      </div>

      {/* Compact link display with action buttons */}
      <div className="space-y-3">
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
          <p className="text-xs text-purple-700 mb-2 font-medium">
            {t("shareableLink")}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-white px-3 py-2 rounded border border-purple-200">
              <p className="text-sm text-purple-900 font-mono truncate">
                {shareLink}
              </p>
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className="flex-shrink-0 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Clipboard className="w-4 h-4 text-purple-600" />
              )}
            </Button>
            <Button
              onClick={handleShare}
              size="icon"
              className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          {t("proTips")}
        </h4>
        <ul className="text-xs text-blue-800 space-y-1.5">
          <li>• {t("proTip1")}</li>
          <li>• {t("proTip2")}</li>
          <li>• {t("proTip3")}</li>
        </ul>
      </div>
    </div>
  );
}