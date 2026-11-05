import type {
  NewsletterContent,
  NewsletterSectionContent,
  SavedNewsletter,
} from "../../../types";

export const LAST_HAND_CODED_NEWSLETTER_EDITION = 24;

const emptyNewsletterSection: NewsletterSectionContent = {
  title: "",
  text: "",
  imageUrl: "",
  imageLink: "",
};

export const makeEmptyNewsletter = (
  editionNumber: number,
): NewsletterContent => ({
  editionNumber,
  subject: "",
  sections: [
    emptyNewsletterSection,
    emptyNewsletterSection,
    emptyNewsletterSection,
  ],
});

export const findSavedNewsletter = (
  savedNewsletters: SavedNewsletter[],
  editionNumber: number,
) =>
  savedNewsletters.find(
    (newsletter) => newsletter.editionNumber === editionNumber,
  );

export const isHandCodedNewsletterEdition = (editionNumber: number) =>
  editionNumber <= LAST_HAND_CODED_NEWSLETTER_EDITION;

export const getNewsletterToEdit = (
  savedNewsletters: SavedNewsletter[],
  editionNumber: number,
): NewsletterContent | null => {
  if (isHandCodedNewsletterEdition(editionNumber)) return null;
  const savedNewsletter = findSavedNewsletter(
    savedNewsletters,
    editionNumber,
  );
  if (!savedNewsletter) return makeEmptyNewsletter(editionNumber);
  return savedNewsletter.sentAt ? null : savedNewsletter;
};

export const getDefaultNewsletterEdition = (
  savedNewsletters: SavedNewsletter[],
  nextEditionNumber: number,
) => {
  const unsentNewsletters = savedNewsletters.filter(
    (newsletter) => !newsletter.sentAt,
  );
  if (unsentNewsletters.length === 0) return nextEditionNumber;
  return Math.max(
    ...unsentNewsletters.map(
      (newsletter) => newsletter.editionNumber,
    ),
  );
};

export const canSendNewsletterEdition = (
  savedNewsletters: SavedNewsletter[],
  editionNumber: number,
) =>
  isHandCodedNewsletterEdition(editionNumber) ||
  findSavedNewsletter(savedNewsletters, editionNumber) !== undefined;

export interface NewsletterEditionOption {
  editionNumber: number;
  label: string;
}

export const listBuilderEditionOptions = (
  savedNewsletters: SavedNewsletter[],
  nextEditionNumber: number,
): NewsletterEditionOption[] => {
  const savedEditionOptions = savedNewsletters.map((newsletter) => ({
    editionNumber: newsletter.editionNumber,
    label: `Newsletter #${newsletter.editionNumber} - ${newsletter.subject}`,
  }));
  const nextEditionOption = {
    editionNumber: nextEditionNumber,
    label: `Newsletter #${nextEditionNumber} (new)`,
  };
  return [...savedEditionOptions, nextEditionOption].sort(
    (first, second) => first.editionNumber - second.editionNumber,
  );
};
