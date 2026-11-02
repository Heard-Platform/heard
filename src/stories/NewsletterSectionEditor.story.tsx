import { useState } from "react";
import { NewsletterSectionEditor } from "../components/admin/newsletter-builder/NewsletterSectionEditor";
import type { NewsletterSectionContent } from "../types";
import {
  emptyNewsletterSection,
  sectionWithLink,
  sectionWithLinkAndImage,
  uploadImageLocally,
  uploadImageThatFails,
} from "./newsletter-fixtures";
import { StoryContainer } from "./StoryContainer";

interface NewsletterSectionEditorWithStateProps {
  initialSection: NewsletterSectionContent;
  onUploadImage: (imageFile: File) => Promise<string>;
}

function NewsletterSectionEditorWithState({ initialSection, onUploadImage }: NewsletterSectionEditorWithStateProps) {
  const [section, setSection] = useState(initialSection);
  return (
    <div className="space-y-3">
      <NewsletterSectionEditor
        sectionNumber={1}
        section={section}
        onChange={setSection}
        onUploadImage={onUploadImage}
      />
      <pre className="text-xs whitespace-pre-wrap border rounded-md p-3">{JSON.stringify(section, null, 2)}</pre>
    </div>
  );
}

export function NewsletterSectionEditorStory() {
  return (
    <StoryContainer
      title="Newsletter Section Editor"
      description="One newsletter section. Select words in the text and click Link; choose an image to upload it. The saved section shows below."
      variants={[
        {
          id: "empty",
          label: "Empty",
          children: (
            <NewsletterSectionEditorWithState initialSection={emptyNewsletterSection} onUploadImage={uploadImageLocally} />
          ),
        },
        {
          id: "text-with-link",
          label: "Text with a link",
          children: (
            <NewsletterSectionEditorWithState initialSection={sectionWithLink} onUploadImage={uploadImageLocally} />
          ),
        },
        {
          id: "image-attached",
          label: "Image attached",
          children: (
            <NewsletterSectionEditorWithState initialSection={sectionWithLinkAndImage} onUploadImage={uploadImageLocally} />
          ),
        },
        {
          id: "upload-fails",
          label: "Upload fails (choose a file)",
          children: (
            <NewsletterSectionEditorWithState initialSection={emptyNewsletterSection} onUploadImage={uploadImageThatFails} />
          ),
        },
      ]}
    />
  );
}
