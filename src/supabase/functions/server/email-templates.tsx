export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@AlexLongHeard";
export const YT_SHORTS_URL = `${YOUTUBE_CHANNEL_URL}/shorts`;

export const getMagicLinkEmail = (magicLinkUrl: string, code: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login to Heard</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #8B5CF6; font-size: 2.5rem; margin: 0;">Heard</h1>
    </div>
    
    <h2 style="color: #333; font-size: 1.5rem; margin: 0 0 16px 0;">Login to Your Account</h2>
    
    <p style="color: #555; line-height: 1.6; margin: 0 0 24px 0;">
      Click the button below to log in to your Heard account. This link will expire in 15 minutes.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${magicLinkUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: bold; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(102,126,234,0.3);">
        Log In to Heard
      </a>
    </div>
    
    <p style="color: #999; font-size: 0.85rem; text-align: center; margin: 16px 0 0 0; line-height: 1.5;">
      Or copy and paste this URL into your browser:
      <br>
      <span style="color: #666; font-family: 'Courier New', monospace; word-break: break-all;">
        ${magicLinkUrl}
      </span>
    </p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <p style="color: #555; margin: 0 0 12px 0; font-size: 0.95rem; text-align: center;">
        <strong>Can't click the button?</strong> Enter this code manually:
      </p>
      <div style="text-align: center; background: white; padding: 16px; border-radius: 8px; border: 2px dashed #8B5CF6;">
        <span style="font-size: 2rem; font-weight: bold; color: #8B5CF6; letter-spacing: 0.2em; font-family: 'Courier New', monospace;">
          ${code}
        </span>
      </div>
    </div>
    
    <p style="color: #666; font-size: 0.9rem; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e0e0e0;">
      If you didn't request this login link, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `;
};

export const styles = {
  body: "margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;",
  container: "max-width: 600px; margin: 0 auto; padding: 40px 20px;",
  header: "text-align: center; margin-bottom: 40px;",
  headerTitle: "color: white; font-size: 4rem; font-weight: 900; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); letter-spacing: 1px;",
  headerSubtitle: "color: rgba(255,255,255,0.9); font-size: 1.2rem; margin-top: 10px;",
  contentCard: "background: white; border-radius: 16px; padding: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);",
  intro: "margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e9ecef;",
  introParagraph: "color: #555; line-height: 1.7; margin: 0; font-size: 1.05rem;",
  section: "margin-bottom: 32px;",
  sectionTitle: "color: #333; font-size: 1.8rem; margin: 0 0 16px 0; border-bottom: 3px solid #667eea; padding-bottom: 12px;",
  paragraph: "color: #555; line-height: 1.7; margin: 0 0 16px 0;",
  image: "width: 100%; height: auto; border-radius: 12px;",
  buttonContainer: "margin: 24px 0;",
  buttonRed: "display: inline-block; background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin-right: 12px; box-shadow: 0 4px 12px rgba(255,0,0,0.3);",
  buttonPurple: "display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 12px rgba(102,126,234,0.3);",
  helpSectionTitle: "color: #333; font-size: 1.8rem; margin: 0 0 24px 0; border-bottom: 3px solid #667eea; padding-bottom: 12px;",
  helpIntro: "color: #333; line-height: 1.8; margin: 0 0 24px 0; font-size: 1.1rem; text-align: center; font-style: italic;",
  helpBox: "margin-bottom: 24px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;",
  helpBoxLast: "padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;",
  helpBoxTitle: "color: #333; font-size: 1.3rem; margin: 0 0 8px 0;",
  helpBoxText: "color: #666; margin: 0; line-height: 1.6;",
  helpBoxTextWithButton: "color: #666; margin: 0 0 12px 0; line-height: 1.6;",
  buttonGreen: "display: inline-block; background: #02a95c; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;",
  closing: "text-align: center; padding-top: 32px; border-top: 2px solid #e9ecef;",
  closingText: "color: #8B5CF6; font-weight: bold; font-size: 1.2rem; margin: 0;",
  signature: "color: #666; margin: 8px 0 0 0;",
  footer: "text-align: center; margin-top: 24px; color: rgba(255,255,255,0.7); font-size: 0.85rem;",
  link: "color: #667eea; text-decoration: none;",
};

const getOrdinalSuffix = (num: number): string => {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th`;
  }
  
  switch (lastDigit) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
};

export const getNewsletterHeader = (editionNumber: number) => `
  <div style="${styles.header}">
    <h1 style="${styles.headerTitle}">
      Ya' Heard?
    </h1>
    <p style="${styles.headerSubtitle}">The ${getOrdinalSuffix(editionNumber)} Edition of the Heard Newsletter!</p>
  </div>
`;

export const getSupportSection = () => `
  <div style="${styles.section}">
    <h2 style="${styles.helpSectionTitle}">
    💜 Thanks to everyone supporting Heard!
    </h2>

    <p style="${styles.helpIntro}">
      Here are more ways you can help if you're wanting to
    </p>
    
    <div style="${styles.helpBox}">
      <h3 style="${styles.helpBoxTitle}">
        1. Use the app! Keep the feedback coming
      </h3>
      <p style="${styles.helpBoxText}">
        Be brutally honest! All the feedback I've gotten so far has been really great. Thank you to everyone who's been using the app. ❤️
      </p>
    </div>

    <div style="${styles.helpBox}">
      <h3 style="${styles.helpBoxTitle}">
        2. Support on GoFundMe
      </h3>
      <p style="${styles.helpBoxTextWithButton}">
        Please consider supporting Heard on GoFundMe to help me work full time on Heard for the next 6 months.
      </p>
      <a href="https://www.gofundme.com/f/support-heard-making-democracy-fun-and-engaging" 
         style="${styles.buttonGreen}">
        💚 Support on GoFundMe
      </a>
    </div>

    <div style="${styles.helpBoxLast}">
      <h3 style="${styles.helpBoxTitle}">
        3. Help with guerrilla marketing
      </h3>
      <p style="${styles.helpBoxText}">
        Do you live in DC and want to get into some totally innocent trouble with me? I'm putting up QR codes around DC for debates on the app and would love any help! Just reply to this email and let me know.
      </p>
    </div>
  </div>

  <div style="${styles.closing}">
    <p style="${styles.closingText}">
      Thanks for being a part of Heard and helping save democracy, one swipe at a time!
    </p>
    <p style="${styles.signature}">
      - Alex
    </p>
  </div>
`;

export const getNewsletterFooter = () => `
  <div style="${styles.footer}">
    <p>You're receiving this because you have an account on Heard</p>
    <p>If you don't want to receive newsletters anymore, just respond to this email and let me know. Thanks!</p>
  </div>
`;

const getMusicLivestreamButtons = (youtubeUrl: string, songRequestRoomUrl: string) => `
  <div style="${styles.buttonContainer}">
    <a href="${youtubeUrl}" 
       style="${styles.buttonRed}">
      📺 Next Live Stream
    </a>
    <a href="${songRequestRoomUrl}" 
       style="${styles.buttonPurple}">
      🎶 Make a Song Request!
    </a>
  </div>
`;

export const getNewsletterEmail = (): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Heard Newsletter</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    
    ${getNewsletterHeader(1)}

    <div style="${styles.contentCard}">
      
      <div style="${styles.intro}">
        <p style="${styles.introParagraph}">
          Hey! We're half way through the 2nd week of the New Year (can you believe it?) and I've got lots of updates to share!
        </p>
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          🚿 10 Daily Cold Showers In To My 100 User Challenge!
        </h2>
        <p style="${styles.paragraph}">
          I'm taking cold showers every day until I hit 100 users! You can see for yourself on <a href="https://www.youtube.com/@AlexLongHeard" style="${styles.link}">YouTube</a> and <a href="https://www.instagram.com/alexmasonlong/" style="${styles.link}">Instagram</a>.
        </p>
        <img src="https://i.ibb.co/YF2CP8yM/Screenshot-2026-01-14-at-11-10-38-AM.png" 
             alt="Cold shower challenge" 
             style="${styles.image}" />
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          🎵 Music Livestream
        </h2>
        <p style="${styles.paragraph}">
          I did a music livestream last week and I'm doing another one this <strong>Friday at 7pm Eastern!</strong> Come hang out and listen to some tunes.
        </p>
        <img src="https://i.ibb.co/n8qVSKqN/Screenshot-2026-01-14-at-11-07-06-AM.png" 
             alt="Music livestream" 
             style="${styles.image}; margin-bottom: 20px;" />
        ${getMusicLivestreamButtons("https://www.youtube.com/@AlexLongHeard", "https://heard.vote/room/ycrrn2a3ijgmk7qj2c8")}
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          🤝 Community Organizing
        </h2>
        <p style="${styles.paragraph}">
          I met with community organizers this week and have some exciting prospects on the horizon! Also did a guerrilla marketing campaign at the Dupont Farmers Market - putting Heard out there in the real world!
        </p>
        <img src="https://i.ibb.co/Q7WhcFyk/Screenshot-2026-01-14-at-11-10-13-AM.png" 
             alt="Community gathering" 
             style="${styles.image}" />
      </div>

      ${getSupportSection()}

    </div>

    ${getNewsletterFooter()}
  </div>
</body>
</html>
  `;
};

export const getNewsletter2Email = (): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Heard Newsletter</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    
    ${getNewsletterHeader(2)}

    <div style="${styles.contentCard}">

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          🎤 Heard was in the news! (not really)
        </h2>
        <p style="${styles.paragraph}">
          We did some guerilla marketing at Farmers Market again and had 15 people vote to close an intersection using Heard!
        </p>
        <a href="https://youtube.com/shorts/q4Mt_I3H8VE">
          <img src="https://i.postimg.cc/wTdKdVcG/Screenshot-2026-01-20-at-1-45-18-PM.png" 
               alt="News feature" 
               style="${styles.image}" />
        </a>
        <p style="${styles.paragraph}">
          You can watch our "coverage" of the event <a href="https://youtube.com/shorts/q4Mt_I3H8VE" style="${styles.link}">here</a>. Thanks to Greg for being an awesome cameraman!
        </p>
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          💔 Breaking hearts, breaking strings
        </h2>
        <p style="${styles.paragraph}">
          I broke my guitar string live on stream! Here's the moment it happened:
        </p>
        <img src="https://i.postimg.cc/9Xk3N2rc/Copy-of-string-break-gif.gif" 
             alt="Breaking guitar string" 
             style="${styles.image}" />
        ${getMusicLivestreamButtons("https://youtube.com/live/-okUoAoYLFQ", "https://heard.vote/room/7zsnxx6po4fmkhlz7r6")}
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">
          🚿 Only 46 users left to end the cold shower mania!
        </h2>
        <p style="${styles.paragraph}">
          We're getting closer! I'm still taking cold showers every day until I hit 100 users. You can watch my daily cold shower videos on <a href="https://www.youtube.com/@AlexLongHeard" style="${styles.link}">YouTube</a> and <a href="https://www.instagram.com/alexmasonlong/" style="${styles.link}">Instagram</a>.
        </p>
      </div>

      ${getSupportSection()}

    </div>

    ${getNewsletterFooter()}
  </div>
</body>
</html>
  `;
};