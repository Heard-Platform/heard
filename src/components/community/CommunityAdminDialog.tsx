import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Share2, Check, Crown } from "lucide-react";
import type { SubHeard } from "../../types";
import { createSubHeardLink } from "../../utils/url";
import { share } from "../../utils/share";

// @ts-ignore
import { toast } from "sonner@2.0.3";
import { formatSubHeardDisplay } from "../../utils/subheard";

interface CommunityAdminDialogProps {
  community: SubHeard;
  userId: string;
  isOpen: boolean;
  onUpdateSubHeard: (name: string, userId: string, isPrivate: boolean) => Promise<boolean>;
  onClose: () => void;
}

export function CommunityAdminDialog({
  community,
  userId,
  isOpen,
  onUpdateSubHeard,
  onClose,
}: CommunityAdminDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTogglePrivacy = async (newPrivacy: boolean) => {
    setIsUpdating(true);
    try {
      const success = await onUpdateSubHeard(community.name, userId, newPrivacy);
      if (success) {
        toast.success(`Community is now ${newPrivacy ? 'unlisted' : 'public'}`);
      } else {
        toast.error("Failed to update community settings");
      }
    } catch (error) {
      console.error("Failed to update sub-heard privacy:", error);
      toast.error("Failed to update community settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShareLink = async () => {
    const url = createSubHeardLink(community);
    
    await share({
      title: `Join ${formatSubHeardDisplay(community.name)} on HEARD!`,
      text: "Check out this community on HEARD!",
      url,
      onSuccess: () => {
        setCopied(true);
        toast.success("Link shared successfully!");
        setTimeout(() => setCopied(false), 2000);
      },
      onError: (error) => {
        toast.error("Could not share link. Please manually copy the URL.");
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Manage Community
          </DialogTitle>
          <DialogDescription>
            {formatSubHeardDisplay(community.name)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Stats</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{community.count}</p>
                <p className="text-xs text-muted-foreground">Total Debates</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{community.isPrivate ? 'Unlisted' : 'Public'}</p>
                <p className="text-xs text-muted-foreground">Visibility</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="privacy-toggle" className="font-medium">
                Unlisted Community
              </Label>
              <p className="text-xs text-muted-foreground">
                Won't appear in public list. Only people with the link can see it
              </p>
            </div>
            <Switch
              id="privacy-toggle"
              checked={community.isPrivate || false}
              onCheckedChange={handleTogglePrivacy}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Share Link</Label>
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
              Share this link to let others participate in your community.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}