import { getNewsletterFooter, getNewsletterHeader, getSupportSection, styles } from "./email-templates.tsx";

export const getNewsletter3Email = (): string => {
  const rickrollUrl = "https://www.youtube.com/shorts/htqGGmCCrAQ";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Heard Newsletter</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    
    ${getNewsletterHeader(3)}

    <div style="${styles.contentCard}">

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          🙏 First GoFundMe contribution!
        </h2>
        <p style="${styles.paragraph}">
          I recently launched my GoFundMe and the first contribution is in! Big thanks to Robbie for that! 🙏
        </p>
        <a href="https://www.gofundme.com/f/support-heard-making-democracy-fun-and-engaging">
          <img src="https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-3-gfm-2.png" 
               alt="First GoFundMe contribution" 
               style="${styles.image}" />
        </a>
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          🎵 AI is bringing back the rickroll
        </h2>
        <p style="${styles.paragraph}">
          We lean into using AI responsibly at Heard, but in our latest prototype <a href="${rickrollUrl}">it got a little clever.</a>
        </p>
        <a href="${rickrollUrl}">
          <img src="https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-3-rickroll-2.gif" 
               alt="AI rickroll incident" 
               style="${styles.image}" />
        </a>
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          🗓️ Roadmap for Jan-Mar
        </h2>
        <p style="${styles.paragraph}">
          January was a big month for getting the word out about the app. Based on user feedback, we're going heads down during February to focus on what we feel is the biggest weakness of the app right now: The "stickiness" of it, i.e. showing people relevant interesting discussions and giving them a reason to stick around. But if you're missing the live streams, don't worry! We'll be back with a bang in March.
        </p>
        <a href="https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-3-roadmap-2.png">
          <img src="https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/nl-3-roadmap-2.png" 
               alt="Roadmap for Jan-Mar" 
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
};