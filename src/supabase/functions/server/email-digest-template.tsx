import { CommunityUpdate, ConversationUpdate, EmailData, FeaturedTake, ParticipatedConversation, TakeUpdate } from "./email-types.ts";

const STYLES = {
  sectionContainer: "margin-bottom: 40px;",
  sectionTitle:
    "color: #030213; font-size: 22px; margin: 0 0 16px 0;",
  statsCard:
    "border-radius: 12px; padding: 20px; margin-bottom: 20px; width: 100%; box-sizing: border-box;",
  statNumber:
    "color: #ffffff; font-size: 32px; font-weight: bold; margin-bottom: 4px;",
  statLabel: "color: rgba(255,255,255,0.9); font-size: 14px;",
  cardBase:
    "padding: 16px; margin-bottom: 12px; border-radius: 8px;",
  cardTitle:
    "font-weight: 600; color: #030213; margin-bottom: 8px; font-size: 16px;",
  badge:
    "padding: 4px 8px; border-radius: 4px; margin-right: 8px;",
  badgeContainer:
    "color: #4a5568; font-size: 14px; margin-bottom: 12px;",
  takeText:
    "color: #2d3748; margin-bottom: 8px; font-size: 15px; line-height: 1.5;",
  voteStats: "color: #4a5568; font-size: 14px;",
  featuredTitle:
    "color: #030213; font-size: 16px; margin: 0 0 8px 0;",
};

const GRADIENTS = {
  purple:
    "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);",
  pink: "background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);",
  blue: "background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);",
  orange:
    "background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);",
};

const CARDS = {
  purple: {
    bg: "#f8f9ff",
    border: "#667eea",
    badge: "#e0e7ff",
  },
  pink: { bg: "#fff5f7", border: "#f5576c", badge: "#fce7eb" },
  blue: { bg: "#f0fcff", border: "#4facfe", badge: "#dbeafe" },
  orange: {
    bg: "#fffbf0",
    border: "#fa709a",
    badge: "#fef3c7",
  },
};

function renderStatCard(
  items: { label: string; value: number }[],
  gradient: string,
): string {
  return `
    <div style="${STYLES.statsCard} ${gradient}">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${items
            .map(
              (item) => `
            <td align="center" style="padding: 0 10px;">
              <div style="${STYLES.statNumber}">${item.value}</div>
              <div style="${STYLES.statLabel}">${item.label}</div>
            </td>
          `,
            )
            .join("")}
        </tr>
      </table>
    </div>
  `;
}

function renderBadges(
  badges: { emoji: string; text: string; color: string }[],
): string {
  return `
    <div style="${STYLES.badgeContainer}">
      ${badges
        .map(
          (badge) => `
        <span style="background-color: ${badge.color}; ${STYLES.badge}">${badge.emoji} ${badge.text}</span>
      `,
        )
        .join("")}
    </div>
  `;
}

function renderVoteStats(
  agrees: number,
  disagrees: number,
): string {
  return `
    <div style="${STYLES.voteStats}">
      <span style="color: #48bb78; margin-right: 12px;">👍 ${agrees} agrees</span>
      <span style="color: #f56565; margin-right: 12px;">👎 ${disagrees} disagrees</span>
    </div>
  `;
}

function renderFeaturedTake(take: FeaturedTake): string {
  return `
    <div style="background-color: ${CARDS.pink.bg}; border-left: 4px solid ${CARDS.pink.border}; ${STYLES.cardBase}">
      <div style="${STYLES.takeText}">"${take.text}"</div>
      ${renderVoteStats(take.agrees, take.disagrees)}
    </div>
  `;
}

export function generateFakeData(): EmailData {
  return {
    conversationsStarted: [
      {
        title: "What it's like being a new dad",
        newTakes: 12,
        newVotes: 47,
        featuredTakes: [
          {
            text: "The hardest part is making decisions when you're exhausted and second-guessing everything.",
            agrees: 18,
            disagrees: 3,
          },
        ],
      },
      {
        title:
          "Getting our neighborhood to finally fix the sidewalks",
        newTakes: 8,
        newVotes: 31,
        featuredTakes: [],
      },
    ],
    takesPosted: [
      {
        text: "The hardest part is making decisions when you're exhausted and second-guessing everything.",
        conversationTitle: "What it's like being a new dad",
        agrees: 18,
        disagrees: 3,
        totalVotes: 21,
      },
      {
        text: "We need to show up to city council meetings with photos",
        conversationTitle:
          "Getting our neighborhood to finally fix the sidewalks",
        agrees: 42,
        disagrees: 7,
        totalVotes: 49,
      },
    ],
    conversationsParticipated: [
      {
        title: "Starting a community fridge",
        newTakes: 23,
        newVotes: 45,
        featuredTake: {
          text: "Local restaurants throw out tons of perfectly good food.",
          agrees: 15,
          disagrees: 8,
        },
      },
      {
        title: "Can you learn to play guitar in your 30s?",
        newTakes: 15,
        newVotes: 28,
        featuredTake: {
          text: "Started at 32. It's humbling but oddly therapeutic.",
          agrees: 10,
          disagrees: 2,
        },
      },
    ],
    communities: [
      {
        name: "The Board Game of Life",
        newConversations: 5,
        activeMembers: 142,
        featuredConvo: {
          title: "What it's like being a new dad",
          newTakes: 12,
          totalParticipants: 23,
        },
      },
      {
        name: "Local Action",
        newConversations: 8,
        activeMembers: 203,
        featuredConvo: {
          title:
            "Getting our neighborhood to finally fix the sidewalks",
          newTakes: 8,
          totalParticipants: 15,
        },
      },
    ],
  };
}

function makeYourConvosSection(
  conversations: ConversationUpdate[],
): string {
  const totalTakes = conversations.reduce(
    (sum, c) => sum + c.newTakes,
    0,
  );
  const totalVotes = conversations.reduce(
    (sum, c) => sum + c.newVotes,
    0,
  );

  return `
    <div style="${STYLES.sectionContainer}">
      <h2 style="${STYLES.sectionTitle}">🔥 Your Conversations</h2>
      ${renderStatCard(
        [
          { label: "New Takes", value: totalTakes },
          { label: "New Votes", value: totalVotes },
        ],
        GRADIENTS.purple,
      )}
      ${conversations
        .map(
          (conv) => `
        <div style="background-color: ${CARDS.purple.bg}; border-left: 4px solid ${CARDS.purple.border}; ${STYLES.cardBase}">
          <div style="${STYLES.cardTitle}">${conv.title}</div>
          ${renderBadges([
            {
              emoji: "💬",
              text: `${conv.newTakes} takes`,
              color: CARDS.purple.badge,
            },
            {
              emoji: "🗳️",
              text: `${conv.newVotes} votes`,
              color: CARDS.purple.badge,
            },
          ])}
          ${
            conv.featuredTakes.length > 0
              ? `
            <div style="margin-top: 12px;">
              <h3 style="${STYLES.featuredTitle}">Featured Takes</h3>
              ${conv.featuredTakes.map((take) => renderFeaturedTake(take)).join("")}
            </div>
          `
              : ""
          }
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function makeYourTakesSection(takes: TakeUpdate[]): string {
  const totalAgrees = takes.reduce(
    (sum, t) => sum + t.agrees,
    0,
  );
  const totalVotes = takes.reduce(
    (sum, t) => sum + t.totalVotes,
    0,
  );

  return `
    <div style="${STYLES.sectionContainer}">
      <h2 style="${STYLES.sectionTitle}">💭 Your Takes</h2>
      ${renderStatCard(
        [
          { label: "Total Agrees", value: totalAgrees },
          { label: "Total Votes", value: totalVotes },
        ],
        GRADIENTS.pink,
      )}
      ${takes
        .map(
          (take) => `
        <div style="background-color: ${CARDS.pink.bg}; border-left: 4px solid ${CARDS.pink.border}; ${STYLES.cardBase}">
          <div style="${STYLES.takeText}">"${take.text}"</div>
          <div style="color: #718096; font-size: 13px; margin-bottom: 12px;">in <strong>${take.conversationTitle}</strong></div>
          ${renderVoteStats(take.agrees, take.disagrees)}
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function makeConvosSection(
  conversations: ParticipatedConversation[],
): string {
  const totalTakes = conversations.reduce(
    (sum, c) => sum + c.newTakes,
    0,
  );
  const totalVotes = conversations.reduce(
    (sum, c) => sum + c.newVotes,
    0,
  );

  return `
    <div style="${STYLES.sectionContainer}">
      <h2 style="${STYLES.sectionTitle}">💬 Convos You Joined</h2>
      ${renderStatCard(
        [
          { label: "New Takes", value: totalTakes },
          { label: "New Votes", value: totalVotes },
        ],
        GRADIENTS.blue,
      )}
      ${conversations
        .map(
          (conv) => `
        <div style="background-color: ${CARDS.blue.bg}; border-left: 4px solid ${CARDS.blue.border}; ${STYLES.cardBase}">
          <div style="${STYLES.cardTitle}">${conv.title}</div>
          ${renderBadges([
            {
              emoji: "💬",
              text: `${conv.newTakes} takes`,
              color: CARDS.blue.badge,
            },
            {
              emoji: "🗳️",
              text: `${conv.newVotes} votes`,
              color: CARDS.blue.badge,
            },
          ])}
          <div style="margin-top: 12px;">
            <h3 style="${STYLES.featuredTitle}">Featured Take</h3>
            ${renderFeaturedTake(conv.featuredTake)}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function makeCommunitiesSection(
  communities: CommunityUpdate[],
): string {
  const totalConversations = communities.reduce(
    (sum, c) => sum + c.newConversations,
    0,
  );

  return `
    <div style="${STYLES.sectionContainer}">
      <h2 style="${STYLES.sectionTitle}">🏘️ Your Communities</h2>
      ${renderStatCard(
        [{ label: "New Convos", value: totalConversations }],
        GRADIENTS.orange,
      )}
      ${communities
        .map(
          (comm) => `
        <div style="background-color: ${CARDS.orange.bg}; border-left: 4px solid ${CARDS.orange.border}; ${STYLES.cardBase}">
          <div style="${STYLES.cardTitle}">h/${comm.name}</div>
          <div style="color: #4a5568; font-size: 14px; margin-bottom: 8px;">
            <span style="background-color: ${CARDS.orange.badge}; ${STYLES.badge}">🔥 ${comm.newConversations} new</span>
            <span style="background-color: ${CARDS.orange.badge}; ${STYLES.badge}">👥 ${comm.activeMembers} active</span>
          </div>
          <div style="margin-top: 12px;">
            <h3 style="${STYLES.featuredTitle}">Featured Conversation</h3>
            <div style="background-color: ${CARDS.purple.bg}; border-left: 4px solid ${CARDS.purple.border}; ${STYLES.cardBase}">
              <div style="${STYLES.cardTitle}">${comm.featuredConvo.title}</div>
              ${renderBadges([
                {
                  emoji: "💬",
                  text: `${comm.featuredConvo.newTakes} takes`,
                  color: CARDS.purple.badge,
                },
                {
                  emoji: "👥",
                  text: `${comm.featuredConvo.totalParticipants} people`,
                  color: CARDS.purple.badge,
                },
              ])}
            </div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

export function generateEmailHtml(data: EmailData, userId: string): string {
  const sections: string[] = [];

  if (data.conversationsStarted.length > 0) {
    sections.push(
      makeYourConvosSection(data.conversationsStarted),
    );
  }

  if (data.takesPosted.length > 0) {
    sections.push(makeYourTakesSection(data.takesPosted));
  }

  if (data.conversationsParticipated.length > 0) {
    sections.push(
      makeConvosSection(data.conversationsParticipated),
    );
  }

  if (data.communities.length > 0) {
    sections.push(makeCommunitiesSection(data.communities));
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Here's what happened since you joined</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="${GRADIENTS.purple} color: #ffffff; padding: 40px 24px; text-align: center;">
          <h1 style="margin: 0 0 8px 0; font-size: 32px;">🎯 The Latest on Heard</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.95;">Here's what's been going on since you joined</p>
        </div>
        
        <div style="padding: 32px 24px;">
          ${sections.join("")}
        </div>
        
        <div style="padding: 24px; text-align: center; color: #717182; font-size: 14px; background-color: #f8f9fa;">
          <a href="https://heard.vote/" style="display: inline-block; ${GRADIENTS.purple} color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-bottom: 24px;">
            Jump Back Into Heard 🎯
          </a>
          <p style="margin: 0 0 8px 0;">Heard - Conversation made fun</p>
          <p style="margin: 0; font-size: 12px;">
            <a href="https://heard.vote/unsubscribe?userId=${userId}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}