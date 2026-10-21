import { useRef, useState } from "react";
import { Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { Cover, CoverType } from "../../types";

type CoverOption = "none" | CoverType;

const COVER_OPTIONS: { value: CoverOption; label: string }[] = [
  { value: "none", label: "None" },
  { value: "image", label: "Image" },
  { value: "youtube", label: "YouTube" },
];

interface CoverPickerProps {
  cover: Cover | null;
  isUploadingImage?: boolean;
  onImageUpload: (file: File) => void;
  onCoverChange: (cover: Cover | null) => void;
}

export function CoverPicker({ cover, isUploadingImage, onImageUpload, onCoverChange }: CoverPickerProps) {
  const [coverType, setCoverType] = useState<CoverOption>(cover?.type ?? "none");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (type: CoverOption) => {
    if (type === coverType) return;
    setCoverType(type);
    if (type === "none") onCoverChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cover card type">
        {COVER_OPTIONS.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            role="radio"
            aria-checked={coverType === value}
            onClick={() => handleTypeChange(value)}
            className={`h-11 rounded-xl text-sm font-semibold ${
              coverType === value
                ? "creation-accent-border creation-tint-bg creation-strong-text border-[1.5px]"
                : "normal-border bg-white text-foreground"
            }`}
          >
            {label}
          </Button>
        ))}
      </div>

      {coverType === "image" && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploadingImage}
            onClick={(e) => {
              e.currentTarget.value = "";
            }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageUpload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploadingImage}
            onClick={() => fileInputRef.current?.click()}
            className="creation-soft-border creation-soft-bg creation-strong-text h-12 w-full rounded-xl border-dashed"
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Uploading...
              </>
            ) : cover?.type === "image" ? (
              <>
                <Check className="size-5" />
                Change image
              </>
            ) : (
              <>
                <ImageIcon className="size-5" />
                Choose an image
              </>
            )}
          </Button>
          {cover?.type === "image" && (
            <img src={cover.url} alt="Cover preview" className="h-40 w-full rounded-xl object-cover" />
          )}
        </div>
      )}

      {coverType === "youtube" && (
        <div className="space-y-2">
          <label htmlFor="cover-youtube-url" className="text-sm font-semibold secondary-text-strong">
            YouTube link
          </label>
          <Input
            id="cover-youtube-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={cover?.type === "youtube" ? cover.url : ""}
            onChange={(e) => onCoverChange(e.target.value ? { type: "youtube", url: e.target.value } : null)}
            className="h-11"
          />
          <p className="text-xs secondary-text">Shows as an intro video before the hot takes.</p>
        </div>
      )}
    </div>
  );
}
