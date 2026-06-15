import { getParameterizedNewsletter } from "./email-newsletter-4.ts";
import { GITHUB_URL, YT_SHORTS_URL } from "./email-templates.tsx";
import { getSubstackArticleEmail } from "./email-substack-article.ts";

const SUPABASE_URL = "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting";
const YT_FIRST_VID_URL = "https://youtu.be/JM0WUrFkYZc";
const YT_FLYERING_URL_NL12 = "https://www.youtube.com/shorts/wnFjDv0S4Bo";
const YT_PUSHUPS_URL_NL12 = "https://www.youtube.com/shorts/JWv-IaL2jh4";
const GITHUB_AI_PR_URL = "https://github.com/Heard-Platform/heard/pull/94";
const YT_HAPPY_HOUR_URL_NL13 = "https://www.youtube.com/shorts/hNqqqJBIkQs";
const SHORTS_URL = "https://www.youtube.com/shorts";

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
      text: "Alex has been heads down on outreach these past few weeks. So far this month he has attended six events, twelve outreach meetings, and is actively in conversation with four organizations about running a pilot program with Heard. The use cases span an interesting mix, from a local community garden, to a business development board, to the local ANC, and we're just gettin' started.",
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
      text: `It took a little longer than expected but the source code for Heard is now <a href='${GITHUB_URL}'>publicly available on GitHub</a>. We wanted to make sure we were doing our due dilligence in shoring up the app's security before releasing it, as we do have people's emails and phone numbers in our database, and we wanted to make sure those were being kept safe. Fair warning, it's startup code, so it isn't all great, but it's out there! Check out the code and contribute if you're interested in helping out!`,
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
      text: `We're 3 months into 2026 now, which means <a href='${YT_FIRST_VID_URL}'>we're halfway through my runway for Heard</a>. It's been a big 3 months, with hundreds of people now having tried the app, and a lot of promising irons in the fire for upcoming partnerships. No newsletter next week as I will be taking a few days to reflect and plan the next steps so we come out swinging in April. 🥊`,
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
      text: `I'll be doing 1 pushup for every day it takes to get to 200 signups, <a href='${YT_PUSHUPS_URL_NL12}'>follow along here.</a> And if you know anyone please send Heard their way to spare my arms 💪`,
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-12-pushups.png",
      imageLink: YT_PUSHUPS_URL_NL12,
      imageAlt: "Heard pushup challenge video",
    },
    section3: {
      title: "🔄 Switching our AI provider",
      text: `Before going on break last week <a href='${GITHUB_AI_PR_URL}'>we overhauled our AI integration</a> so that we aren't locked in to OpenAI, our previous AI provider, and then switched to Google's Gemini instead. This flexibility will allow us to choose the platform offering the best service that's also most aligned with our principles and mission.`,
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
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-13-happy-hour-2.gif",
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
  getParameterizedNewsletter({
    subject: "Ya' Heard #14: New Organizer Features, Kalorama Park Flyering, and Pushup Challenge Progress",
    editionNumber: 14,
    section1: {
      title: "🛠️ New Organizer Features: Merging Similar Responses and Better Insights",
      text: "Hosts can now <a href='https://heard-platform.github.io/heard/organizer-tools.html'>select similar responses to merge them</a> so that the analysis treats them as the same response. We've already used this feature for a recent park survey! We've also improved the insights view for organizers.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-14-organizer-tools.png",
      imageLink: "https://heard.vote",
      imageAlt: "Heard new organizer features",
    },
    section2: {
      title: "🌳 How do DC locals feel about Kalorama Park?",
      text: "<a href='https://www.youtube.com/shorts/C7pC3D8nJkg'>We put up about 15 flyers around Kalorama Park</a> asking people to weigh in on what they love and want to see improved about the park. We've had about 50 people scan the flyers so far!",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-14-kalorama-park.png",
      imageLink: "https://www.youtube.com/shorts/C7pC3D8nJkg",
      imageAlt: "Kalorama Park flyering",
    },
    section3: {
      title: "💪 Alex is Getting Swole from Pushups",
      text: "I started a pushup challenge <a href='https://www.youtube.com/shorts/JWv-IaL2jh4'>at the start of April</a> to do 1 extra pushup per day until we get 200 signups. We're up to 117, 83 to go! If this goes too far into May things may get interesting. 💪",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-14-pushup-challenge.png",
      imageLink: "https://www.youtube.com/shorts/JWv-IaL2jh4",
      imageAlt: "Pushup challenge progress",
    },
  }),
  getParameterizedNewsletter({
    subject: "No More Pushups - Ya' Heard #15",
    editionNumber: 15,
    section1: {
      title: "🎉 307 animal rights activists debrief on Heard",
      text: "In the single biggest post we've seen on Heard yet, last weekend 307 people involved in an animal rights action used Heard to debrief the event. In total, 8,899 votes were cast on 31 different statements over the span of about 24 hours. This brings the total number of user signups on Heard to 358, well over the 200 threshold for my daily pushup challenge, and oh-so-close to the July 4th goal of 500 signups. <a href='https://www.youtube.com/shorts/E0FxCb2QmDY'>I made a silly video to celebrate</a>. A big shoutout to the organizers and voters who made this happen. 🙏🎉",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-15-pushup-celebration.png",
      imageLink: "https://www.youtube.com/shorts/E0FxCb2QmDY",
      imageAlt: "Pushup challenge celebration video",
    },
    section2: {
      title: "🐀 DC residents can't agree on how they feel about their rats",
      text: "In our latest endeavor to bring Heard to the streets, we put up flyers around Dupont asking residents how they feel about rats in DC and what they want done. So far 65 people have weighed in on the debate, and interestingly, rat birth control is an overwhelmingly popular solution. 💊",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-15-dc-rats.png",
      imageLink: "https://heard.vote",
      imageAlt: "DC residents discussing rat control solutions",
    },
    section3: {
      title: "🔧 Once more for the moderators",
      text: "In preparation for the pilot program last weekend, we shipped a ton of new moderation and analysis features. 📊 Moderators of conversations on Heard can now merge similar responses, hide problematic ones, and even pause all responses completely if need be. We've also beefed up the user clustering analysis significantly to make it much easier to drill down into the details of why people voted the way they did.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-15-moderation.png",
      imageLink: "https://heard.vote",
      imageAlt: "Moderators using new features on Heard",
    },
  }),
  getParameterizedNewsletter({
    subject: "DC Running on Heard - Ya' Heard #16",
    editionNumber: 16,
    section1: {
      title: "🏛️ DC candidates looking at using Heard for their campaigns",
      text: "We're in conversation with a select group of DC candidates who are considering integrating Heard into their campaigns, demonstrating a commitment to a truly people-powered platform. Combined with our flyering campaigns that have seen 300+ DC residents vote on Heard so far, we're excited to become a bigger part of the DC civic landscape!",
      imageUrl: `${SUPABASE_URL}/nl-16-talk-bubbles.jpeg`,
      imageLink: "https://heard.vote",
      imageAlt: "Heard being used by DC candidates",
    },
    section2: {
      title: "🐕 Should dogs be allowed off leash in Kalorama Park?",
      text: "A few weeks we did a poll of people's priorities for Kalorama and unleashed dogs emerged as a contentious subject. <a href='https://www.youtube.com/shorts/2VUDjdAkGkU'>Last week we followed up with flyers digging into that topic.</a> We've had 128 people weigh in, and so far it's been evenly split. Supporters say they enjoy what dogs add to the park, while people opposing it mention incidents they've had with unleashed dogs that made them feel unsafe or uncomfortable, and also argue that there are other dog park options nearby.",
      imageUrl: `${SUPABASE_URL}/nl-16-dog-results.png`,
      imageLink: "https://heard.vote",
      imageAlt: "Heard poll about unleashed dogs in Kalorama Park",
    },
    section3: {
      title: "🔧 Analysis features can't stop, won't stop",
      text: "Following up <a href='https://www.youtube.com/shorts/E0FxCb2QmDY'>our successful 307-person deployment last week</a>, we've continued to build out the organizer analysis features on Heard. We've added a vote matrix for organizers to help dig into anonymized specifics of the data, with a soon-to-be-added download feature. We've also improved and expanded the “distinguishing statements” cluster section to help provide more insights into different groups of voters.",
      imageUrl: `${SUPABASE_URL}/nl-16-vote-matrix.png`,
      imageLink: "https://heard.vote",
      imageAlt: "Heard new analysis features",
    },
  }),
  getParameterizedNewsletter({
    subject: "400 signups! 🎉 Ya' Heard #17",
    editionNumber: 17,
    section1: {
      title: "🎉 Heard hits 400 signups!",
      text: `Thanks to two big Heard posts on unleashed dog policy and an animal rescue event (plus a little organic traction), we are currently at 406 signed up users. That’s 406 vetted real people that provided either an email or phone number and tried Heard! 💯 500 is our next big goal and I’m doing a <a href='${SHORTS_URL}/557972zpK4o'>daily shoot-till-I-make-it basketball challenge</a> until we get there. 🏀`,
      imageUrl: `${SUPABASE_URL}/nl-17-400-users.png`,
      imageLink: `${SHORTS_URL}/557972zpK4o`,
      imageAlt: "Alex doing basketball challenge",
    },
    debate: {
      title: "🗳️ Vote on Heard's logo",
      question: "Heard needs a real logo (and no the monkey won't do) 🐒 Tap one of the buttons below to vote on this design and add your ideas! Spicy takes welcome.",
      imageUrl: `${SUPABASE_URL}/nl-17-logo.jpg`,
      agreeLabel: "Like it",
      disagreeLabel: "Needs work",
      flyerId: "y56b6fdgoimp5wo8vy",
      statementId: "4i3okqoff4amp5wo8wg",
    },
    section2: {
      title: "🐀 Over twenty Dupont residents show up to think like a rat",
      text: "A few weeks ago we flyered Dupont Circle about the “rat situation” and saw 92 residents vote on the post. Over the weekend the official “Think like a rat” event took place with over two dozen residents attending! (Pic courtesy of Goodweather for Mayor campaign)",
      imageUrl: `${SUPABASE_URL}/nl-17-rats-2.jpg`,
      imageLink: "https://heard.vote",
      imageAlt: "Dupont residents at the Think Like a Rat event",
    },
  }),
  getParameterizedNewsletter({
    subject: "Our first official partnership! 🤝 Ya' Heard #18",
    editionNumber: 18,
    section1: {
      title: "🤝 Our first official partnership!",
      text: "A major DC delegate candidate gave Heard a shoutout in her latest newsletter, marking our first official partnership! 🎉 We're running Heard posts on key issues relevant to her campaign to draw attention to the issues and get voters more engaged for the upcoming DC primary.",
      imageUrl: `${SUPABASE_URL}/nl-18-candidate-1.png`,
      imageLink: "https://heard.vote",
      imageAlt: "First official Heard partnership announcement",
    },
    section2: {
      title: "🔔 Adding a new update center",
      text: "We've made it easier to catch up on Heard posts you've participated in! You can now tap your avatar in the app to see if there have been any new votes or responses in threads you've engaged with",
      imageUrl: `${SUPABASE_URL}/nl-18-updates.png`,
      imageLink: "https://heard.vote",
      imageAlt: "Heard update center feature",
    },
    section3: {
      title: "🐶 Conference organizer talks about Heard results",
      text: "Remember the 307-person debrief we ran for the Ridglan beagle rescue back in April? One of the event's organizers <a href='https://www.youtube.com/shorts/MNrL20ngOeY'>just presented the Heard results on stage at a conference</a>, walking through what activists agreed on, where they split, and what they want to see next. Seeing Heard data inform real movement strategy is what this is all about. 🙌",
      imageUrl: `${SUPABASE_URL}/nl-18-conf.png`,
      imageLink: "https://www.youtube.com/shorts/MNrL20ngOeY",
      imageAlt: "Ridglan rescue organizer presenting Heard results at a conference",
    },
  }),
  getParameterizedNewsletter({
    subject: "Sentiment on a Spectrum - Ya' Heard #19",
    editionNumber: 19,
    section1: {
      title: "📊 New: The Statement Spectrum",
      text: "We just added a new visualization that shows you exactly where each statement in a Heard post falls on the spectrum from strong agreement to strong disagreement. Statements clustered toward one end are clear consensus, while ones in the middle are where opinions are most split. Check it out in the insights view of any post.",
      imageUrl: `${SUPABASE_URL}/nl-19-spectrum.gif`,
      imageLink: "https://heard.vote",
      imageAlt: "Heard statement spectrum visualization",
    },
    section2: {
      title: "🏀 Alex's Arms Are Getting Tired...",
      text: `We're on day 23 of the <a href='${SHORTS_URL}/R3qRQGuYfm4'>daily basketball challenge</a> — shoot from one foot farther every day until we hit 500 signups. Alex started from a foot away and is now almost at half-court. We have some flyering coming up soon that should help push us over the line but if you know someone who'd be into Heard please send it their way. 🙏`,
      imageUrl: `${SUPABASE_URL}/nl-19-basketball.png`,
      imageLink: `${SHORTS_URL}/R3qRQGuYfm4`,
      imageAlt: "Alex shooting basketball from near half-court",
    },
    section3: {
      title: "🛒 Should the Farmers Market Take Over the Circle?",
      text: "On a recent ANC call, someone raised the idea of moving the Dupont Farmers Market directly onto the circle to help with overcrowding, and of course the Heard team was on it! We put up flyers, polled market-goers, and the results were actually pretty split. We brought the preliminary data to the ANC and presented the findings: Any decision is months if not years away but it was an exciting early example of stoking conversations on hyperlocal issues around the neighborhood.",
      imageUrl: `${SUPABASE_URL}/nl-19-dupont.jpeg`,
      imageLink: "https://heard.vote",
      imageAlt: "Dupont Farmers Market flyering results and ANC presentation",
    },
  }),
]

const offset = 8

export const getNewsletterEmailByEdition = (newsletterEdition: number) => {
  if (newsletterEdition === 20) {
    return getSubstackArticleEmail();
  }
  
  const newsletter = newsletters[newsletterEdition - offset];
  if (!newsletter) {
    throw new Error(`Newsletter edition ${newsletterEdition} not found`);
  }
  return newsletter;
}