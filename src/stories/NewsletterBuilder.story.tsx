import { NewsletterBuilder } from "../components/admin/newsletter-builder/NewsletterBuilder";
import {
  emptyNewsletter,
  filledNewsletter,
  newsletterWithBlankThirdSection,
  saveNewsletterSuccessfully,
  saveNewsletterThatFails,
  uploadImageLocally,
  uploadImageThatNeverFinishes,
} from "./newsletter-fixtures";
import { StoryContainer } from "./StoryContainer";

export function NewsletterBuilderStory() {
  return (
    <StoryContainer
      title="Newsletter Builder"
      description="Admin panel form: subject plus 3 sections of title, text with links, uploaded image and image link"
      variants={[
        {
          id: "new-edition",
          label: "New edition",
          children: (
            <NewsletterBuilder
              newsletter={emptyNewsletter}
              onSave={saveNewsletterSuccessfully}
              onUploadImage={uploadImageLocally}
            />
          ),
        },
        {
          id: "filled",
          label: "Filled in",
          children: (
            <NewsletterBuilder
              newsletter={filledNewsletter}
              onSave={saveNewsletterSuccessfully}
              onUploadImage={uploadImageLocally}
            />
          ),
        },
        {
          id: "blank-third-section",
          label: "Section 3 blank",
          children: (
            <NewsletterBuilder
              newsletter={newsletterWithBlankThirdSection}
              onSave={saveNewsletterSuccessfully}
              onUploadImage={uploadImageLocally}
            />
          ),
        },
        {
          id: "image-uploading",
          label: "Image uploading (choose a file)",
          children: (
            <NewsletterBuilder
              newsletter={emptyNewsletter}
              onSave={saveNewsletterSuccessfully}
              onUploadImage={uploadImageThatNeverFinishes}
            />
          ),
        },
        {
          id: "save-fails",
          label: "Save fails",
          children: (
            <NewsletterBuilder
              newsletter={filledNewsletter}
              onSave={saveNewsletterThatFails}
              onUploadImage={uploadImageLocally}
            />
          ),
        },
      ]}
    />
  );
}
