import { createClientFromEnv } from "./db-utils.ts";
import { NewsletterParams, getParameterizedNewsletter } from "./email-newsletter-4.ts";
import { getAllNewsletters, getNewsletter, saveNewsletterRecord } from "./kv-utils.tsx";
import { convertNewsletterMarkdownToHtml, escapeHtml } from "./newsletter-markdown-utils.ts";
import { RouteError } from "./route-error.ts";

export const FIRST_NEWSLETTER_BUILDER_EDITION = 25;
const NEWSLETTER_IMAGE_BUCKET = "public-hosting";
const NEWSLETTER_SECTION_COUNT = 3;

export interface NewsletterSection {
  title: string;
  text: string;
  imageUrl: string;
  imageLink: string;
}

export type NewsletterSections = [NewsletterSection, NewsletterSection, NewsletterSection];

export interface Newsletter {
  editionNumber: number;
  subject: string;
  sections: NewsletterSections;
  sentAt?: number;
  updatedAt: number;
}

export interface SaveNewsletterRequest {
  editionNumber: number;
  subject: string;
  sections: unknown[];
}

type RenderedNewsletterSection = NewsletterParams["section1"];

const isNewsletterSection = (section: unknown): section is NewsletterSection => {
  if (typeof section !== "object" || section === null) return false;
  const { title, text, imageUrl, imageLink } = section as Record<string, unknown>;
  return [title, text, imageUrl, imageLink].every((field) => typeof field === "string");
};

const toNewsletterSections = (sections: unknown[]): NewsletterSections => {
  const [firstSection, secondSection, thirdSection] = sections;
  if (
    sections.length !== NEWSLETTER_SECTION_COUNT ||
    !isNewsletterSection(firstSection) ||
    !isNewsletterSection(secondSection) ||
    !isNewsletterSection(thirdSection)
  ) {
    throw new RouteError(
      `A newsletter needs exactly ${NEWSLETTER_SECTION_COUNT} sections, each with a title, text, imageUrl and imageLink`,
      400,
    );
  }
  return [firstSection, secondSection, thirdSection];
};

export const isNewsletterBuilderEdition = (editionNumber: number) =>
  Number.isInteger(editionNumber) && editionNumber >= FIRST_NEWSLETTER_BUILDER_EDITION;

export const getNextNewsletterEditionNumber = (newsletters: Newsletter[]) =>
  newsletters.reduce(
    (highestEditionNumber, newsletter) => Math.max(highestEditionNumber, newsletter.editionNumber + 1),
    FIRST_NEWSLETTER_BUILDER_EDITION,
  );

export const listNewsletters = async () => {
  const newsletters = await getAllNewsletters();
  return {
    newsletters: newsletters.sort((first, second) => second.editionNumber - first.editionNumber),
    nextEditionNumber: getNextNewsletterEditionNumber(newsletters),
  };
};

export const saveNewsletter = async ({ editionNumber, subject, sections }: SaveNewsletterRequest) => {
  if (!isNewsletterBuilderEdition(editionNumber)) {
    throw new RouteError(`Newsletter builder editions start at ${FIRST_NEWSLETTER_BUILDER_EDITION}`, 400);
  }
  if (!subject.trim()) {
    throw new RouteError("A newsletter needs a subject", 400);
  }
  const newsletterSections = toNewsletterSections(sections);

  const existingNewsletter = await getNewsletter(editionNumber);
  if (existingNewsletter?.sentAt) {
    throw new RouteError(`Newsletter #${editionNumber} was already sent and can't be edited`, 409);
  }

  const newsletter: Newsletter = {
    editionNumber,
    subject: subject.trim(),
    sections: newsletterSections,
    updatedAt: Date.now(),
  };
  await saveNewsletterRecord(newsletter);
  return { newsletter };
};

export const markNewsletterSent = async (editionNumber: number) => {
  if (!isNewsletterBuilderEdition(editionNumber)) return;
  const newsletter = await getNewsletter(editionNumber);
  if (!newsletter || newsletter.sentAt) return;
  await saveNewsletterRecord({ ...newsletter, sentAt: Date.now() });
};

const isBlankSection = (section: NewsletterSection) =>
  [section.title, section.text, section.imageUrl, section.imageLink].every((field) => !field.trim());

const toRenderedNewsletterSection = (section: NewsletterSection): RenderedNewsletterSection => ({
  title: escapeHtml(section.title.trim()),
  text: convertNewsletterMarkdownToHtml(section.text),
  imageUrl: escapeHtml(section.imageUrl.trim()),
  imageAlt: escapeHtml(section.title.trim()),
  imageLink: escapeHtml(section.imageLink.trim()),
});

export const toNewsletterParams = (newsletter: Newsletter): NewsletterParams => {
  const [firstSection, secondSection, thirdSection] = newsletter.sections;
  return {
    subject: newsletter.subject,
    editionNumber: newsletter.editionNumber,
    section1: toRenderedNewsletterSection(firstSection),
    section2: toRenderedNewsletterSection(secondSection),
    section3: isBlankSection(thirdSection) ? undefined : toRenderedNewsletterSection(thirdSection),
  };
};

export const getNewsletterBuilderEmail = async (editionNumber: number) => {
  if (!isNewsletterBuilderEdition(editionNumber)) return null;
  const newsletter = await getNewsletter(editionNumber);
  return newsletter ? getParameterizedNewsletter(toNewsletterParams(newsletter)) : null;
};

const makeNewsletterImageFilename = (imageFile: File) => {
  const extension = imageFile.name.split(".").pop() || "jpg";
  return `newsletter-${Date.now()}-${crypto.randomUUID()}.${extension}`;
};

export const uploadNewsletterImage = async (formData: FormData) => {
  const imageFile = formData.get("image");
  if (!(imageFile instanceof File)) {
    throw new RouteError("No image file provided", 400);
  }
  if (!imageFile.type.startsWith("image/")) {
    throw new RouteError("File must be an image", 400);
  }

  const storage = createClientFromEnv().storage.from(NEWSLETTER_IMAGE_BUCKET);
  const filename = makeNewsletterImageFilename(imageFile);
  const { error } = await storage.upload(filename, new Uint8Array(await imageFile.arrayBuffer()), {
    contentType: imageFile.type,
    upsert: false,
  });
  if (error) {
    throw new Error(`Failed to upload newsletter image: ${error.message}`);
  }

  return { imageUrl: storage.getPublicUrl(filename).data.publicUrl };
};
