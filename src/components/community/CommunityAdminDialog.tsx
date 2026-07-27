import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Share2, Check, Crown, UserPlus, Trash2 } from "lucide-react";
import type { SubHeard } from "../../types";
import { createSubHeardLink, createModInviteLink } from "../../utils/url";
import { share } from "../../utils/share";
import { CommunitySettingsPanel } from "./CommunitySettingsPanel";
import { useDebateSession } from "../../hooks/useDebateSession";
import { useTranslation } from "react-i18next";

// @ts-ignore
import { toast } from "sonner@2.0.3";
import { formatSubHeardDisplay } from "../../utils/subheard";

interface CommunityAdminDialogProps {
  community: SubHeard;
  userId: string;
  isOpen: boolean;
  onUpdateSubHeard: (
    updatedCommunity: SubHeard,
    userId: string,
  ) => Promise<boolean>;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}

export function CommunityAdminDialog({
  community,
  userId,
  isOpen,
  onUpdateSubHeard,
  onRefresh,
  onClose,
}: CommunityAdminDialogProps) {
  const { t } = useTranslation(["community", "common", "toast"]);
  const { createModInvite, clearSubHeardMods } = useDebateSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [isClearingMods, setIsClearingMods] = useState(false);

  const handleUpdate = async (update: Partial<SubHeard>) => {
    setIsUpdating(true);
    const updatedCommunity = {
      ...community,
      ...update,
    };
    try {
      const success = await onUpdateSubHeard(updatedCommunity, userId);
      if (success) {
        toast.success(t("toast:settingsUpdated"));
      } else {
        toast.error(t("toast:settingsUpdateFailed"));
      }
    } catch (error) {
      console.error("Failed to update sub-heard:", error);
      toast.error(t("toast:settingsUpdateFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInviteMod = async () => {
    setIsCreatingInvite(true);
    try {
      const response = await createModInvite(community.name);
      if (!response?.success || !response.data?.token) {
        toast.error(t("toast:inviteLinkFailed"));
        return;
      }
      const link = createModInviteLink(community.name, response.data.token);
      await share({
        title: t("shareModTitle", { community: formatSubHeardDisplay(community.name) }),
        text: t("shareModText"),
        url: link,
        onSuccess: () => toast.success(t("toast:modInviteShared")),
        onError: () => toast.error(t("toast:shareLinkManual")),
      });
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleClearMods = async () => {
    setIsClearingMods(true);
    try {
      const response = await clearSubHeardMods(community.name);
      if (response?.success) {
        toast.success(t("toast:allModsRemoved"));
        await onRefresh();
      } else {
        toast.error(t("toast:removeModsFailed"));
      }
    } finally {
      setIsClearingMods(false);
    }
  };

  const handleShareLink = async () => {
    const url = createSubHeardLink(community);
    
    await share({
      title: t("shareCommunityTitle", { community: formatSubHeardDisplay(community.name) }),
      text: t("shareCommunityText"),
      url,
      onSuccess: () => {
        setCopied(true);
        toast.success(t("toast:linkSharedSuccess"));
        setTimeout(() => setCopied(false), 2000);
      },
      onError: (error) => {
        toast.error(t("toast:shareLinkManual"));
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            {t("manageCommunity")}
          </DialogTitle>
          <DialogDescription>
            {formatSubHeardDisplay(community.name)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("stats")}</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{community.count}</p>
                <p className="text-xs text-muted-foreground">{t("totalPosts")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{community.modIds?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("moderators")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{community.isPrivate ? t("unlisted") : t("public")}</p>
                <p className="text-xs text-muted-foreground">{t("visibility")}</p>
              </div>
            </div>
          </div>

          <CommunitySettingsPanel
            community={community}
            isUpdating={isUpdating}
            onChange={handleUpdate}
          />

          {community.adminId === userId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("moderators")}</Label>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleInviteMod}
                disabled={isCreatingInvite}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isCreatingInvite ? t("creatingInvite") : t("createModInvite")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("modInviteHelper")}
              </p>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleClearMods}
                disabled={isClearingMods || (community.modIds?.length ?? 0) === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isClearingMods ? t("removing") : t("removeAllMods", { count: community.modIds?.length ?? 0 })}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("shareLink")}</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={createSubHeardLink(community)}
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("shareLinkHelper")}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("common:close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}