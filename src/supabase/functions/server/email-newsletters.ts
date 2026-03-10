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
      text: "We're adding a way for users to change their avatar on Heard to another animal once they've earned enough points. What animal do you want to see? Add your ideas here: <a href='https://heard.vote/room/sbrs1maf9kmmb6ujkw'>https://heard.vote/room/sbrs1maf9kmmb6ujkw</a>.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-8-mascots.png",
      imageLink: "https://heard.vote/room/sbrs1maf9kmmb6ujkw",
      imageAlt: "Mascot voting campaign",
    },
    section3: {
      title: "💬 The First Heard Substack Post",
      text: "I published my first Substack post last week talking about the paradox of the American government and how I'm thinking Heard and other CivTech platforms could help address it.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-8-substack.png",
      imageLink: "https://substack.com/home/post/p-188672969",
      imageAlt: "First substack post feature",
    },
  }),
  getParameterizedNewsletter({
    subject: "Heard Newsletter #9: Open Sourcing Heard!",
    editionNumber: 9,
    section1: {
      title: "💻 Heard is going open source!",
      text: "I just published a new Substack post announcing that I'm open sourcing Heard! We had a great <a href='https://heard.vote/os'>conversation on Heard about this</a>, and I really appreciate everyone's inputs.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-9-open-source.png",
      imageLink: "https://alexlongheard.substack.com/p/why-im-open-sourcing-heard",
      imageAlt: "Heard is open source announcement",
    },
    section2: {
      title: "🚀 30 randos voted on cleaning up the Potomac",
      text: "My friend and I put up flyers around the DC waterfront about <a href='http://heard.vote/potomac'>cleaning up the Potomac</a>, and we got 30 signups to the app!",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-9-flyers.png",
      imageLink: "http://heard.vote/potomac",
      imageAlt: "Heard flyer campaign",
    },
    section3: {
      title: "🌳 I spent some time in nature",
      text: "I published my first long form YouTube video in the woods of Virginia talking about tech and my motivations for building Heard",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-9-long-form.png",
      imageLink: "https://www.youtube.com/watch?v=g999yMXw3A4",
      imageAlt: "Heard long form video in the woods",
    },
  }),
]

const offset = 8

export const getNewsletterEmailByEdition = (newsletterEdition: number) =>
  newsletters[newsletterEdition - offset];