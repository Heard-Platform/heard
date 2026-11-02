import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import type { NewsletterContent, NewsletterSectionContent } from "../../../types";
import { NewsletterSectionEditor } from "./NewsletterSectionEditor";

type NewsletterSaveStatus = "unsaved" | "saving" | "saved" | "failed";

interface NewsletterBuilderProps {
  newsletter: NewsletterContent;
  onSave: (newsletter: NewsletterContent) => Promise<void>;
  onUploadImage: (imageFile: File) => Promise<string>;
}

const saveButtonLabels: Record<NewsletterSaveStatus, string> = {
  unsaved: "Save",
  saving: "Saving...",
  saved: "Saved",
  failed: "Save",
};

export function NewsletterBuilder({ newsletter, onSave, onUploadImage }: NewsletterBuilderProps) {
  const [draftNewsletter, setDraftNewsletter] = useState<NewsletterContent>(newsletter);
  const [saveStatus, setSaveStatus] = useState<NewsletterSaveStatus>("unsaved");

  const updateDraftNewsletter = (changes: Partial<NewsletterContent>) => {
    setDraftNewsletter((currentNewsletter) => ({ ...currentNewsletter, ...changes }));
    setSaveStatus("unsaved");
  };

  const updateSection = (sectionIndex: number, updatedSection: NewsletterSectionContent) => {
    const sections: NewsletterContent["sections"] = [...draftNewsletter.sections];
    sections[sectionIndex] = updatedSection;
    updateDraftNewsletter({ sections });
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await onSave(draftNewsletter);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error saving newsletter:", error);
      setSaveStatus("failed");
    }
  };

  const canSave = draftNewsletter.subject.trim() !== "" && saveStatus !== "saving" && saveStatus !== "saved";

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl">Newsletter #{draftNewsletter.editionNumber}</h2>

      <div className="space-y-1">
        <Label htmlFor="newsletter-subject">Subject</Label>
        <Input
          id="newsletter-subject"
          value={draftNewsletter.subject}
          onChange={(event) => updateDraftNewsletter({ subject: event.target.value })}
          placeholder="Heard Newsletter #25: ..."
        />
      </div>

      {draftNewsletter.sections.map((section, sectionIndex) => (
        <NewsletterSectionEditor
          key={sectionIndex}
          sectionNumber={sectionIndex + 1}
          section={section}
          onChange={(updatedSection) => updateSection(sectionIndex, updatedSection)}
          onUploadImage={onUploadImage}
        />
      ))}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={!canSave}>
          <Save className="w-4 h-4 mr-2" />
          {saveButtonLabels[saveStatus]}
        </Button>
        {saveStatus === "failed" && <p className="text-sm error-text">Save failed. Try again.</p>}
      </div>
    </Card>
  );
}
