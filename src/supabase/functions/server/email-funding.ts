import { getNewsletterFooter, styles } from "./email-templates.tsx";
import { SUPABASE_URL } from "./constants.tsx";

export const getSubstackArticleEmail = (): { subject: string; html: string } => {
  const subject = "The Future of DC's Next Community App";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="${styles.body} background: white;">
  <div style="${styles.container} padding: 24px 8px;">

    <div style="${styles.contentCard} padding: 0; box-shadow: none; border-radius: 0;">

      <div style="${styles.section}">
        <h2 style="color: #333; font-size: 2rem; margin: 0 0 8px 0; line-height: 1.2;">
          The Future of DC's Next Community App
        </h2>
        <p style="color: #888; font-style: italic; margin: 0 0 20px 0;">
          And why you may have seen our flyers about Waymo around DC
        </p>
        <p style="${styles.paragraph}">
          When we first started putting up flyers asking people how they feel about Waymo in DC, rats in Dupont, or unleashed dogs in Kalorama Park, I didn't expect to get many responses. There are already plenty of flyers and ads shouting at us to vote for this person or buy that product, so it's easy to distrust that a flyer is genuinely asking you how you feel about things.
        </p>
        <a href="${SUPABASE_URL}/fund-rats-flyer.jpeg">
          <img src="${SUPABASE_URL}/fund-rats-flyer.jpeg"
               alt="Heard flyer asking about rats in Dupont Circle"
               style="${styles.image}" />
        </a>
      </div>

      <div style="${styles.section}">
        <p style="${styles.paragraph}">
          But at Heard, we're asking because we <strong>believe that expressing your voice</strong>, when it's listened to, when it's heard, is addictive, is empowering. We're asking because we want to poke and tickle the cynicism in the system that tells us we can't really change things. We're asking because we believe a <strong>community that's connected</strong>, participating, and taking ownership in the world around it is the antidote to fascism. And we believe this idea is what the United States, for all its flaws, was built on. So what better way to celebrate our 250th birthday than to help reignite that flame?
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
        <p style="${styles.paragraph}">
          So where does that leave us? Well, after papering the city with hundreds of flyers asking people to vote on local topics, <strong>we're pretty proud with the numbers we've put on the board</strong>.
        </p>
        <a href="${SUPABASE_URL}/fund-flyer-collage.png">
          <img src="${SUPABASE_URL}/fund-flyer-collage.png"
               alt="Collage of Heard flyers across DC"
               style="${styles.image}" />
        </a>
      </div>

      <div style="${styles.section}">
        <p style="${styles.paragraph}">
          We've had 400+ DC residents participate in our posts who have probably never heard the phrase, "deliberative tech". And they haven't just voted, they've added their own ideas, experiences, and opinions into the mix.
        </p>
        <a href="${SUPABASE_URL}/fund-response.jpeg">
          <img src="${SUPABASE_URL}/fund-response.jpeg"
               alt="Example response card from a Heard post"
               style="${styles.image}" />
        </a>
      </div>

      <div style="${styles.section}">
        <p style="${styles.paragraph}" style="margin-top: 16px;">
          We also had 307 animal rescuers from the <a href="https://bfp.org/" style="${styles.link}">Wisconsin Beagle Rescue Action</a> use Heard to debrief a recent major operation.
        </p>
        <a href="${SUPABASE_URL}/fund-spectrum.jpeg">
          <img src="${SUPABASE_URL}/fund-spectrum.jpeg"
               alt="Heard statement spectrum from the beagle rescue debrief"
               style="${styles.image}" />
        </a>
      </div>

      <div style="${styles.section}">
        <p style="${styles.paragraph}" style="margin-top: 16px;">
          We've had a ton of support from amazing allies, advisors, and fans, and even raised a few hundred dollars.
        </p>
      </div>

      <div style="${styles.section}">
        <p style="${styles.paragraph}">
          That all being said, I set some pretty ambitious goals for July 4th, and we're dangerously close to missing them. 🚨<strong>The #1 goal I need your help with is reaching $5k in funding</strong>. If I don't reach this goal, I will get a 1 year tattoo chosen by the users of Heard, as promised! More importantly though, reaching this goal would validate that the hundreds of hours I've spent on this project over the past 6 months are actually the right thing for me to be doing. Your donation is a little, "keep going!", whispered in my ear for the months to come.
        </p>
        <p style="${styles.paragraph}">
          So if you're up for it, I'd love for you to chip in whatever you feel inspired to give. You can head over to <strong><a href="https://heard.vote/fund" style="${styles.link}">heard.vote/fund</a></strong> now to do that. Know you will have my eternal gratitude no matter what you're willing to offer. And I'll see you back out there with the next spicy topic to discuss soon.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://heard.vote/fund"
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 18px 56px; border-radius: 10px; font-weight: bold; font-size: 1.2rem; box-shadow: 0 4px 16px rgba(102,126,234,0.4);">
            💜 Support Heard
          </a>
        </div>
      </div>

      <div style="${styles.closing}">
        <p style="${styles.signature}">- Alex</p>
      </div>

    </div>

    ${getNewsletterFooter()}
  </div>
</body>
</html>
  `;

  return { subject, html };
};
