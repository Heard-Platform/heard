import { getNewsletterFooter, getNewsletterHeader, getSupportSection, styles } from "./email-templates.tsx";

interface NewsletterSection {
  title: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
  imageLink?: string;
}

export interface NewsletterParams {
  subject: string;
  editionNumber: number;
  section1: NewsletterSection;
  section2: NewsletterSection;
  section3: NewsletterSection;
}

export const GFM_URL = "https://www.gofundme.com/f/support-heard-making-democracy-fun-and-engaging"

export const getParameterizedNewsletter = (params: NewsletterParams): { subject: string; html: string } => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Heard Newsletter</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    
    ${getNewsletterHeader(params.editionNumber)}

    <div style="${styles.contentCard}">

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          ${params.section1.title}
        </h2>
        <p style="${styles.paragraph}">
          ${params.section1.text}
        </p>
        <a href="${params.section1.imageLink || params.section1.imageUrl}">
          <img src="${params.section1.imageUrl}" 
               alt="${params.section1.imageAlt}" 
               style="${styles.image}" />
        </a>
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          ${params.section2.title}
        </h2>
        <p style="${styles.paragraph}">
          ${params.section2.text}
        </p>
        <a href="${params.section2.imageLink || params.section2.imageUrl}">
          <img src="${params.section2.imageUrl}" 
               alt="${params.section2.imageAlt}" 
               style="${styles.image}" />
        </a>
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          ${params.section3.title}
        </h2>
        <p style="${styles.paragraph}">
          ${params.section3.text}
        </p>
        <a href="${params.section3.imageLink || params.section3.imageUrl}">
          <img src="${params.section3.imageUrl}" 
               alt="${params.section3.imageAlt}" 
               style="${styles.image}" />
        </a>
      </div>

      ${getSupportSection()}

    </div>

    ${getNewsletterFooter()}
  </div>
</body>
</html>
  `;

  return {
    subject: params.subject,
    html,
  };
};

export const getNewsletter4Email = (): { subject: string; html: string } => {
  return getParameterizedNewsletter({
    subject: "Heard Newsletter #4: New Domain, 30 Days of Cold Showers & $100 Milestone!",
    editionNumber: 4,
    section1: {
      title: "🌐 Domain changed to heard.vote!",
      text: "Big news! We've got a shiny new domain at <strong>heard.vote</strong>. Plus, you can now sign up and log in using just your phone number with SMS verification.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-4-new-domain.png",
      imageLink: "https://heard.vote",
      imageAlt: "New domain and SMS verification",
    },
    section2: {
      title: "🥶 Day 30 of cold showers and the water's not getting any warmer",
      text: "We're up to 63 users out of 100 before I can end my cold shower challenge! If you know anyone who might be interested in trying out Heard, please let them know. I think my neighbors are starting to get worried about all the screams coming from my apartment every morning.",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-4-cold-showers.png",
      imageLink: "https://youtube.com/shorts/4MhRE8Gc8Wc?feature=share",
      imageAlt: "Coming soon placeholder",
    },
    section3: {
      title: "🎯 GoFundMe hits $100!",
      text: "We hit our first milestone! The GoFundMe passed $100 in donations. A huge thanks to my latest donor (who encouraged me to set this up in the first place)!",
      imageUrl: "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-4-100-dollar-gfm.png",
      imageLink: GFM_URL,
      imageAlt: "GoFundMe exceeds $100",
    },
  });
};