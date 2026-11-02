import { ChangeEvent, SyntheticEvent, useRef, useState } from "react";
import { ImagePlus, Link } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import type { NewsletterSectionContent } from "../../../types";
import {
  TextSelectionRange,
  isTextSelectionEmpty,
  wrapSelectedTextInMarkdownLink,
} from "./newsletter-text-links";

interface NewsletterSectionEditorProps {
  sectionNumber: number;
  section: NewsletterSectionContent;
  onChange: (section: NewsletterSectionContent) => void;
  onUploadImage: (imageFile: File) => Promise<string>;
}

const emptySelection: TextSelectionRange = { start: 0, end: 0 };

export function NewsletterSectionEditor({
  sectionNumber,
  section,
  onChange,
  onUploadImage,
}: NewsletterSectionEditorProps) {
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [textSelection, setTextSelection] = useState<TextSelectionRange>(emptySelection);
  const [isEnteringLinkUrl, setIsEnteringLinkUrl] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [hasImageUploadFailed, setHasImageUploadFailed] = useState(false);

  const fieldId = (fieldName: string) => `newsletter-section-${sectionNumber}-${fieldName}`;

  const updateSection = (changes: Partial<NewsletterSectionContent>) => {
    onChange({ ...section, ...changes });
  };

  const closeLinkUrlEntry = () => {
    setIsEnteringLinkUrl(false);
    setLinkUrl("");
  };

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    closeLinkUrlEntry();
    updateSection({ text: event.target.value });
  };

  const handleTextSelect = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    setTextSelection({ start: textarea.selectionStart, end: textarea.selectionEnd });
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    updateSection({ text: wrapSelectedTextInMarkdownLink(section.text, textSelection, linkUrl) });
    setTextSelection(emptySelection);
    closeLinkUrlEntry();
  };

  const handleImageFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0];
    event.target.value = "";
    if (!imageFile) return;

    setIsUploadingImage(true);
    setHasImageUploadFailed(false);
    try {
      const imageUrl = await onUploadImage(imageFile);
      updateSection({ imageUrl });
    } catch (error) {
      console.error("Error uploading newsletter image:", error);
      setHasImageUploadFailed(true);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <h3 className="font-semibold">Section {sectionNumber}</h3>

      <div className="space-y-1">
        <Label htmlFor={fieldId("title")}>Title</Label>
        <Input
          id={fieldId("title")}
          value={section.title}
          onChange={(event) => updateSection({ title: event.target.value })}
          placeholder="🎉 Big news"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor={fieldId("text")}>Text</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTextSelectionEmpty(textSelection)}
            onClick={() => setIsEnteringLinkUrl(true)}
          >
            <Link className="w-4 h-4 mr-1" />
            Link
          </Button>
        </div>
        <Textarea
          id={fieldId("text")}
          value={section.text}
          onChange={handleTextChange}
          onSelect={handleTextSelect}
          placeholder="Select words, then click Link to turn them into a link"
          className="min-h-28"
        />
        {isEnteringLinkUrl && (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleAddLink()}
              placeholder="https://"
              aria-label="Link URL"
            />
            <Button type="button" size="sm" onClick={handleAddLink} disabled={!linkUrl.trim()}>
              Add link
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={closeLinkUrlEntry}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label>Image</Label>
        {section.imageUrl && (
          <img src={section.imageUrl} alt={section.title} className="max-h-48 rounded-md border" />
        )}
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChosen}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploadingImage}
          onClick={() => imageFileInputRef.current?.click()}
        >
          <ImagePlus className="w-4 h-4 mr-1" />
          {isUploadingImage ? "Uploading..." : section.imageUrl ? "Replace image" : "Upload image"}
        </Button>
        {hasImageUploadFailed && <p className="text-sm error-text">Image upload failed. Try again.</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor={fieldId("image-link")}>Image link (optional)</Label>
        <Input
          id={fieldId("image-link")}
          value={section.imageLink}
          onChange={(event) => updateSection({ imageLink: event.target.value })}
          placeholder="Where clicking the image goes"
        />
      </div>
    </div>
  );
}
