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
import { Plus } from "lucide-react";
import { CommunitySettingsPanel } from "./CommunitySettingsPanel";
import type { SubHeard } from "../../types";
import { api } from "../../utils/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { normalizeSubHeardName } from "../../utils/subheard";

interface CreateCommunityDialogProps {
  isOpen: boolean;
  userId: string;
  onCreated: (communityName: string) => void;
  onClose: () => void;
}

export function CreateCommunityDialog({
  isOpen,
  userId,
  onCreated,
  onClose,
}: CreateCommunityDialogProps) {
  const { t } = useTranslation(["community", "common", "toast"]);
  const [community, setCommunity] = useState<Partial<SubHeard>>({
    name: "",
    isPrivate: false,
    hostOnlyPosting: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!community.name?.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const response = await api.createSubHeard(community);
      
      if (response?.success) {
        const normalizedName = normalizeSubHeardName(community.name);
        setCommunity({
          name: "",
          isPrivate: false,
          hostOnlyPosting: false,
        });
        onCreated(normalizedName);
        onClose();
        toast.success(t("toast:communityCreated", { name: community.name }));
      } else {
        throw new Error(response?.error || "Failed to create community");
      }
    } catch (error) {
      console.error("Failed to create community:", error);
      toast.error(t("toast:createCommunityFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCommunity({
        name: "",
        isPrivate: false,
        hostOnlyPosting: false,
      });
      onClose();
    }
  };

  const handleCommunityChange = (updates: Partial<SubHeard>) => {
    setCommunity(prev => ({ ...prev, ...updates }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-600" />
            {t("createNewCommunity")}
          </DialogTitle>
          <DialogDescription>
            {t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="community-name">{t("communityName")}</Label>
            <Input
              id="community-name"
              placeholder={t("namePlaceholder")}
              value={community.name || ""}
              onChange={(e) => handleCommunityChange({ name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
              maxLength={50}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {t("nameHelper")}
            </p>
          </div>

          <CommunitySettingsPanel
            community={community}
            isUpdating={isCreating}
            onChange={handleCommunityChange}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("common:cancel")}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!community.name?.trim() || isCreating}
          >
            {isCreating ? t("creating") : t("createCommunityButton")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}