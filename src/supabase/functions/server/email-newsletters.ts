import { getParameterizedNewsletter } from "./email-newsletter-4.ts";
import { YT_SHORTS_URL } from "./email-templates.tsx";

const newsletters = [
  getParameterizedNewsletter({
    subject: "Heard Newsletter #8: March Marketing and the Next Mascot!",
    editionNumber: 8,
    section1: {
      title: "💌 Marketing March is Here",
      text: "This March I'm going all out on marketing and outreach. The goal is to get ONE pilot program run with a group or organization, and get at least 100 more people to try out the app. I'll be documenting the journey with daily day-in-the-life videos.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-8-ditl.png",
      imageLink: YT_SHORTS_URL,
      imageAlt: "marketing march",
    },
    section2: {
      title: "🦁 Pick the Next Heard Mascot!",
      text: "We're adding a way for users to change their avatar on Heard to another animal once they've earned enough points. What animal do you want to see? Add your ideas here: <a href='https://heard.vote/room/sbrs1maf9kmmb6ujkwl'>https://heard.vote/room/sbrs1maf9kmmb6ujkwl</a>.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-8-mascots.png",
      imageLink: "https://heard.vote/room/sbrs1maf9kmmb6ujkwl",
      imageAlt: "Mascot voting campaign",
    },
    section3: {
      title: "💬 The First Heard Substack Post",
      text: "I published my first Substack post last week talking about the paradox of the American government and how I'm thinking Heard and other CivTech platforms could solve it.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-8-substack.png",
      imageLink: "https://substack.com/home/post/p-188672969",
      imageAlt: "First substack post feature",
    },
  })
]

const offset = 8

export const getNewsletterEmailByEdition = (newsletterEdition: number) =>
  newsletters[newsletterEdition - offset];