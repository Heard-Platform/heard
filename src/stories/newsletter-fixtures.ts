import type { NewsletterContent, NewsletterSectionContent } from "../types";

const PUBLIC_HOSTING_URL = "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting";

export const emptyNewsletterSection: NewsletterSectionContent = {
  title: "",
  text: "",
  imageUrl: "",
  imageLink: "",
};

export const sectionWithLinkAndImage: NewsletterSectionContent = {
  title: "🚮 We put up flyers about DC's bottle pickup program",
  text: "Last weekend we put up about 30 flyers asking people how they feel about DC's new bottle bill. [Check out the post here](https://heard.vote).",
  imageUrl: `${PUBLIC_HOSTING_URL}/nl-24-bottle-flyers.png`,
  imageLink: "https://heard.vote",
};

export const sectionWithLink: NewsletterSectionContent = {
  ...sectionWithLinkAndImage,
  imageUrl: "",
  imageLink: "",
};

export const emptyNewsletter: NewsletterContent = {
  editionNumber: 25,
  subject: "",
  sections: [emptyNewsletterSection, emptyNewsletterSection, emptyNewsletterSection],
};

export const filledNewsletter: NewsletterContent = {
  editionNumber: 25,
  subject: "Heard Newsletter #25: Georgetown, PRGN, and a new builder",
  sections: [
    {
      title: "🏛️ Heard is a Public Benefit Corporation",
      text: "We're legally committed to making civic engagement more fun and accessible. [Learn more](https://heard.vote).",
      imageUrl: `${PUBLIC_HOSTING_URL}/nl-7-pbc.png`,
      imageLink: "",
    },
    sectionWithLinkAndImage,
    {
      title: "📊 Heard supports demographics",
      text: "Add demographic questions to any post and see how different groups vote.",
      imageUrl: `${PUBLIC_HOSTING_URL}/nl-24-demographics.jpg`,
      imageLink: "https://heard.vote",
    },
  ],
};

export const newsletterWithBlankThirdSection: NewsletterContent = {
  ...filledNewsletter,
  sections: [filledNewsletter.sections[0], filledNewsletter.sections[1], emptyNewsletterSection],
};

const waitMilliseconds = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const uploadImageLocally = async (imageFile: File) => {
  await waitMilliseconds(1000);
  return URL.createObjectURL(imageFile);
};

export const uploadImageThatNeverFinishes = () => new Promise<string>(() => {});

export const uploadImageThatFails = async (): Promise<string> => {
  await waitMilliseconds(1000);
  throw new Error("Upload failed");
};

export const saveNewsletterSuccessfully = async () => {
  await waitMilliseconds(800);
};

export const saveNewsletterThatFails = async () => {
  await waitMilliseconds(800);
  throw new Error("Save failed");
};
