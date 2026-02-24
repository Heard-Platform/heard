import { getParameterizedNewsletter } from "./email-newsletter-4.ts";
import { YOUTUBE_CHANNEL_URL } from "./email-templates.tsx";

export const getNewsletter7Email = (): { subject: string; html: string } => {
  return getParameterizedNewsletter({
    subject: "Heard Newsletter #7: Public Benefit Corp, Custom Feeds & March Outreach Blitz!",
    editionNumber: 7,
    section1: {
      title: "🏛️ Heard is now officially a Public Benefit Corporation!",
      text: "Big news: We are now registered as a Delaware Public Benefit Corporation. This means we're legally committed to our stated public benefit purpose, which is to make civic engagement more fun and accessible for everyone.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-7-pbc.png",
      imageLink: "",
      imageAlt: "Heard Public Benefit Corporation",
    },
    section2: {
      title: "🎨 Feed customization",
      text: "You can now customize your feed by choosing which communities to follow — and new users land directly inside a live open feed, skipping signup friction entirely. We're already seeing some interesting conversations spring up. 🤔",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-7-feed.png",
      imageLink: "https://heard.vote",
      imageAlt: "Community customization feature",
    },
    section3: {
      title: "🚀 March outreach: live streams, daily posts & doing discovery",
      text: "Remember that time Alex broke his string on stream? Well, there's more where that came from. I'm hitting the ground running in March! I'll be doing music streams again, a post-per-day challenge, and lots of outreach. <strong>Here's where you come in:</strong> If you know anyone in the community organizing or political space who might be interested in using Heard, please connect me with them. We're looking to partner with organizers, activists, and community leaders who want to make civic engagement more fun and accessible.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-7-music-live.png",
      imageLink: YOUTUBE_CHANNEL_URL,
      imageAlt: "March outreach campaign",
    },
  });
};
