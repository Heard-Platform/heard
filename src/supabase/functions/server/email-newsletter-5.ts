import { getParameterizedNewsletter } from "./email-newsletter-4.ts";

export const getNewsletter5Email = (): { subject: string; html: string } => {
  return getParameterizedNewsletter({
    subject: "Heard Newsletter #5: New Community Features, The Mom Test & Taking Heard to the Streets!",
    editionNumber: 5,
    section1: {
      title: "🛠️ New community features",
      text: "We're ramping up the community management tools to make Heard more organizer-friendly! Admins can now enable <strong>host-only posting</strong> to control who creates new conversations, add <strong>more seed statements</strong> to diversify the initial arguments, and <strong>flag problematic responses</strong> to keep communities healthy.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-5-community-features.gif",
      imageAlt: "New community management features",
    },
    section2: {
      title: "📖 Lessons from \"The Mom Test\"",
      text: "As part of my <a href=\"https://www.youtube.com/watch?v=JM0WUrFkYZc\">goals to read 3 startup books</a> by July 4th, I'm reading \"The Mom Test\" (or \"The Mum Test\" as my British accountability coach calls it). It's a good read on all the inherent issues with asking your mom, \"Do you think my idea is good?\" and how to ask questions that get at what people really think and need.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-5-mom-test.png",
      imageLink: "https://www.youtube.com/shorts/kOVOh_wqNA4",
      imageAlt: "The Mom Test book cover",
    },
    section3: {
      title: "🚧 Guerrilla marketing: Taking Heard to the Streets!",
      text: "Last time we got 15 strangers at a farmers market to vote on closing an intersection! This week we're gonna ask people about an upcoming city proposal to pedestrianize a few blocks near Dupont Circle.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-5-guerilla-marketing.jpeg",
      imageAlt: "Dupont Circle pedestrianization concept",
    },
  });
};
