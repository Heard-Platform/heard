import { getParameterizedNewsletter } from "./email-newsletter-4.ts";
import { GITHUB_URL, YT_SHORTS_URL } from "./email-templates.tsx";

const YT_FIRST_VID_URL = "https://youtu.be/JM0WUrFkYZc";
const YT_FLYERING_URL_NL12 = "https://www.youtube.com/shorts/wnFjDv0S4Bo";
const YT_PUSHUPS_URL_NL12 = "https://www.youtube.com/shorts/JWv-IaL2jh4";
const GITHUB_AI_PR_URL = "https://github.com/Heard-Platform/heard/pull/94";
const YT_HAPPY_HOUR_URL_NL13 = "https://www.youtube.com/shorts/hNqqqJBIkQs";

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
  getParameterizedNewsletter({
    subject: "Heard Newsletter #10: Alex Hits the Pavement",
    editionNumber: 10,
    section1: {
      title: "🚶 Hitting the Pavement",
      text: "Alex has been heads down on outreach these past few weeks. So far this month he has attended six events, twelve outreach meetings, and is actively in conversation with four organizations about running a pilot program with Heard. The use cases span an interesting mix, from a local community garden, to a business development board, to the local ANC, and we’re just gettin’ started.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-10-garden.jpeg",
      imageLink: "https://heard.vote",
      imageAlt: "Heard outreach efforts",
    },
    section2: {
      title: "🏙️ Heard Around Town",
      text: "Last week Heard was used live to end a civic tech event with a survey about which project attendees were most excited about. Watching results populate in real time on the big screen was a pretty cool moment.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-10-meetup2.gif",
      imageLink: "https://heard.vote",
      imageAlt: "Heard around town",
    },
    section3: {
      title: "🤝 Know Someone Who Could Use Heard?",
      text: "If you work with or know anyone who organizes people in any capacity (including yourself!), we'd love to talk. This could be someone running a neighborhood association, a local softball league, or a trivia night at the bar, as well as larger scale operations like political candidates looking to expand their reach or companies wanting to hear from their teams. We're offering free pilot programs right now and will work with you every step of the way to get it deployed and get people engaging. Just hit reply or reach out directly.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-10-organizers.png",
      imageLink: "https://heard.vote",
      imageAlt: "Heard organizers",
    },
  }),
  getParameterizedNewsletter({
    subject: "Heard Newsletter #11: Open Sourcing, New Avatars, and Midway Reflections",
    editionNumber: 11,
    section1: {
      title: "🎉 Heard is now officially open source!",
      text: `It took a little longer than expected but the source code for Heard is now <a href='${GITHUB_URL}'>publicly available on GitHub</a>. We wanted to make sure we were doing our due dilligence in shoring up the app’s security before releasing it, as we do have people’s emails and phone numbers in our database, and we wanted to make sure those were being kept safe. Fair warning, it’s startup code, so it isn’t all great, but it’s out there! Check out the code and contribute if you’re interested in helping out!`,
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-11-github.png",
      imageLink: GITHUB_URL,
      imageAlt: "Heard open source on GitHub",
    },
    section2: {
      title: "🐘 Choose Your Own Mascot",
      text: "You can now tap the monkey in the app and switch to a bunch of other animal choices, such as elephant and panda, which were two of the highest voted choices.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-11-avatar.gif",
      imageLink: "https://heard.vote",
      imageAlt: "Heard new mascot options",
    },
    section3: {
      title: "⏳ A Moment of Reflection",
      text: `We’re 3 months into 2026 now, which means <a href='${YT_FIRST_VID_URL}'>we’re halfway through my runway for Heard</a>. It’s been a big 3 months, with hundreds of people now having tried the app, and a lot of promising irons in the fire for upcoming partnerships. No newsletter next week as I will be taking a few days to reflect and plan the next steps so we come out swinging in April. 🥊`,
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-11-yt.png",
      imageLink: YT_FIRST_VID_URL,
      imageAlt: "Heard reflection video still",
    },
  }),
  getParameterizedNewsletter({
    subject: "Ya' Heard #12: Flyering, pushups, and AI provider autonomy",
    editionNumber: 12,
    section1: {
      title: "🔖 Let the flyering resume!",
      text: `Heard is going hyper local! <a href='${YT_FLYERING_URL_NL12}'>We put up some flyers</a> for the next commissioner of a Dupont sub-neighborhood and have more flyering campaigns planned for April.`,
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-12-flyer.jpeg",
      imageLink: YT_FLYERING_URL_NL12,
      imageAlt: "Heard open source on GitHub",
    },
    section2: {
      title: "💪 New challenge! An extra pushup per day til 200 signups",
      text: `I’ll be doing 1 pushup for every day it takes to get to 200 signups, <a href='${YT_PUSHUPS_URL_NL12}'>follow along here.</a> And if you know anyone please send Heard their way to spare my arms 💪`,
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-12-pushups.png",
      imageLink: YT_PUSHUPS_URL_NL12,
      imageAlt: "Heard pushup challenge video",
    },
    section3: {
      title: "🔄 Switching our AI provider",
      text: `Before going on break last week <a href='${GITHUB_AI_PR_URL}'>we overhauled our AI integration</a> so that we aren't locked in to OpenAI, our previous AI provider, and then switched to Google’s Gemini instead. This flexibility will allow us to choose the platform offering the best service that’s also most aligned with our principles and mission.`,
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-12-ai.png",
      imageLink: GITHUB_AI_PR_URL,
      imageAlt: "Heard AI provider switch GitHub PR",
    },
  }),
  getParameterizedNewsletter({
    subject: "Ya' Heard #13: A Makeover, Happy Hour, and Demographics",
    editionNumber: 13,
    section1: {
      title: "💋 Giving Heard a Makeover",
      text: "We know Heard is a little weird (in a good way!), but we want to make it as easy and fun to use as possible. This week we cleaned up the UI to follow more common patterns to make you feel more at home!",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-13-makeover.gif",
      imageLink: "https://heard.vote",
      imageAlt: "Heard homepage makeover",
    },
    section2: {
      title: "🍻 Heard at Happy Hour!",
      text: `We had <a href='${YT_HAPPY_HOUR_URL_NL13}'>18 people at a happy hour</a> weigh in about pedestrianizing a few nearby blocks on a <a href='https://heard.vote'>heard.vote</a> poll. The city is running a program to decide which areas to “pedestrianize”, i.e. close to personal vehicles, and we're hoping Dupont could be a candidate!`,
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-13-happy-hour.gif",
      imageLink: YT_HAPPY_HOUR_URL_NL13,
      imageAlt: "Heard at Happy Hour",
    },
    section3: {
      title: "📊 New Feature: Demographics!",
      text: "When creating conversations on Heard you can now mix demographic questions into the deck. This allows people to see a better breakdown of who's participating and what voices are being represented.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-13-demographics.png",
      imageLink: "https://heard.vote",
      imageAlt: "Heard demographics feature",
    },
  }),
]

const offset = 8

export const getNewsletterEmailByEdition = (newsletterEdition: number) => {
  const newsletter = newsletters[newsletterEdition - offset];
  if (!newsletter) {
    throw new Error(`Newsletter edition ${newsletterEdition} not found`);
  }
  return newsletter;
}