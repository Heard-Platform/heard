import { getParameterizedNewsletter } from "./email-newsletter-4.ts";

export const getNewsletter6Email = (): { subject: string; html: string } => {
  return getParameterizedNewsletter({
    subject: "Heard Newsletter #6: Breaking 100 Users, Guerrilla Marketing Success & Media Coverage!",
    editionNumber: 6,
    section1: {
      title: "🎉 102 users and the end of cold showers!",
      text: "We did it! 102 people have now voted, posted, or browsed on Heard! 🎉 This means the end of cold shower videos (I know you're disappointed). <a href=\"https://www.youtube.com/shorts/OXHx9-6bzBY\">I did make one final video though if you're curious.</a> A big shoutout to everyone who made up that 102 people. What challenge should I commit to for the 200 user milestone? 🤔",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-6-cold-shower.png",
      imageLink: "https://www.youtube.com/shorts/OXHx9-6bzBY",
      imageAlt: "Celebrating 100 users milestone",
    },
    section2: {
      title: "🚶 Guerrilla Marketing Take 2",
      text: "Last week <a href=\"https://www.youtube.com/shorts/fIpEsMH1OKY\">we put up flyers and conducted street interviews</a> on a local question of whether or not to pedestrianize two blocks of a popular street. We had 25 people in total vote and add their own statements, with generally broad support for pedestrianization. (Don't ask me about the sampling bias of only polling via sidewalk flyers that drivers can't scan though 😬 If only everyone already had Heard on their phones.)",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-6-pedestrianize-17th.png",
      imageLink: "https://www.youtube.com/shorts/fIpEsMH1OKY",
      imageAlt: "Guerrilla marketing at Dupont Circle",
    },
    section3: {
      title: "📰 Someone wrote a substack article about us!",
      text: "A big thanks to Paul Spinrad for covering us in his latest Substack post. If you're curious about the civic tech world that Heard comes from, it's a great (& quick) read! Check it out here: <a href='https://substack.com/home/post/p-186845070'>https://substack.com/home/post/p-186845070</a>",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-6-main-street.jpeg",
      imageAlt: "Heard featured in Substack article",
    },
  });
};
