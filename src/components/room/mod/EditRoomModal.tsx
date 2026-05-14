// @ts-ignore
import { toast } from "sonner@2.0.3";

import { useState } from "react";
import { AlertTriangle, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { api } from "../../../utils/api";
import { useDebateSession } from "../../../hooks/useDebateSession";
import { DebateRoom } from "../../../types";

interface EditRoomModalProps {
  room: DebateRoom;
  hasVotes: boolean;
  onClose: () => void;
}

export function EditRoomModal({ room, hasVotes, onClose }: EditRoomModalProps) {
  const { updateRoom } = useDebateSession();

  const [topic, setTopic] = useState(room.topic);
  const [description, setDescription] = useState<string>(room.description ?? "");
  const [imageUrl, setImageUrl] = useState<string>(room.imageUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const titleChanged = topic.trim() !== room.topic && topic.trim().length > 0;
  const descriptionChanged = description !== (room.description ?? "");
  const imageChanged = imageUrl !== (room.imageUrl ?? "");
  const canSave =
    (titleChanged || descriptionChanged || imageChanged) &&
    !isUploading &&
    !isSaving;

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await api.uploadDebateImage(file);
      if (result.success && result.data?.imageUrl) {
        setImageUrl(result.data.imageUrl);
        toast.success("Image uploaded!");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const updates: {
      topic?: string;
      description?: string;
      imageUrl?: string;
    } = {};
    if (titleChanged) updates.topic = topic.trim();
    if (descriptionChanged) updates.description = description;
    if (imageChanged) updates.imageUrl = imageUrl;

    setIsSaving(true);
    const response = await updateRoom(room.id, updates);
    setIsSaving(false);

    if (response?.success) {
      toast.success("Post updated");
      onClose();
    } else {
      toast.error(response?.error || "Failed to update post");
    }
  };

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
          <DialogDescription>
            Update the title, description, or cover image for this post.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {hasVotes && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Voting has already started. Editing the title or description
                may mislead voters about what they're agreeing or disagreeing with.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-room-title">Title</Label>
            <Input
              id="edit-room-title"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Post title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-room-description">Description</Label>
            <Textarea
              id="edit-room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Post description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Cover image</Label>
            <input
              type="file"
              id="edit-room-image"
              accept="image/*"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = "";
              }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
              }}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("edit-room-image")?.click()}
              disabled={isUploading}
              className="w-full h-auto py-4 border-2 border-dashed"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : imageUrl ? (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Image set. Click to change</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  <span>Choose an image</span>
                </div>
              )}
            </Button>
            {imageUrl && (
              <div className="rounded-xl overflow-hidden border">
                <img
                  src={imageUrl}
                  alt="Cover preview"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            {imageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setImageUrl("")}
                className="text-muted-foreground"
              >
                Remove image
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
