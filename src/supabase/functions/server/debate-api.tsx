// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { recalculateClustersForRoom } from "./clustering.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { subheardApi } from "./subheard-api.tsx";
import { getUserMemberships } from "./membership-utils.tsx";

// Type definitions - exported for use in other modules
export type VoteType =
  | "agree"
  | "disagree"
  | "pass"
  | "super_agree";

export interface Statement {
  id: string;
  text: string;
  author: string;
  agrees: number; // Will be calculated from Vote records
  disagrees: number; // Will be calculated from Vote records
  passes: number; // Will be calculated from Vote records
  superAgrees: number; // Will be calculated from Vote records
  type?: string; // Will be calculated on backend later
  isSpicy?: boolean;
  roomId: string;
  timestamp: number;
  round: number; // Round number (1, 2, or 3)
  voters: { [userId: string]: VoteType }; // Will be calculated from Vote records
}

export interface Vote {
  id: string;
  statementId: string;
  userId: string;
  voteType: VoteType;
  timestamp: number;
}

export type Phase =
  | "lobby"
  | "round1"
  | "round2"
  | "round3"
  | "results";
export type SubPhase = "posting" | "voting" | "review";
export type DebateMode = "realtime" | "host-controlled";

export interface DebateRoom {
  id: string;
  topic: string;
  phase: Phase;
  subPhase?: SubPhase;
  gameNumber: number;
  roundStartTime: number;
  participants: string[];
  hostId: string; // ID of the user who created the room
  isActive: boolean;
  createdAt: number;
  mode: DebateMode; // Controls whether phases advance automatically or by host
  rantFirst?: boolean; // Whether this room starts with rants
  subHeard?: string; // Sub-heard name (like subreddits) - optional for backwards compatibility
}

export interface Rant {
  id: string;
  text: string;
  author: string;
  roomId: string;
  timestamp: number;
}

export interface UserSession {
  id: string;
  nickname: string;
  email: string;
  score: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
  isTestUser?: boolean; // Flag to indicate if this is a test/fake user
  isDeveloper?: boolean;
}

const app = new Hono();

// Utility functions
const generateId = () =>
  Math.random().toString(36).substring(2) +
  Date.now().toString(36);

// Helper to get statement by ID using LIKE pattern (statement:%:statementId)
export const getStatementById = async (
  statementId: string,
): Promise<Statement | null> => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("kv_store_f1a393b4")
    .select("value")
    .like("key", `statement:%:${statementId}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching statement by ID:", error);
    return null;
  }

  if (!data?.value) {
    return null;
  }

  try {
    return JSON.parse(data.value);
  } catch (e) {
    console.error("Error parsing statement:", e);
    return null;
  }
};

// Reusable email sending function
const sendEmail = async (params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found in environment");
      return false;
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Heard <hello@heard-now.com>",
          to: [params.to],
          subject: params.subject,
          html: params.html,
          ...(params.text && { text: params.text }),
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to send email to ${params.to}:`,
        errorText,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Welcome email using reusable function
const sendWelcomeEmail = async (
  email: string,
  nickname: string,
) => {
  const welcomeHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8B5CF6; margin-bottom: 10px;">Welcome to HEARD!</h1>
        <p style="color: #666; font-size: 18px;">Ready to argue and save democracy? 🚀</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0;">Hey ${nickname}! 👋</h2>
        <p style="margin: 0; line-height: 1.6;">You're all set to jump into fast-paced debates that make arguing fun and educational. Get ready to earn points, build bridges, and maybe change some minds!</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #333; margin-bottom: 15px;">What's Next?</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">🎯 <strong>Join a debate</strong> - Jump into active rooms or create your own</li>
          <li style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">💬 <strong>Share statements</strong> - Earn points for posting thoughtful arguments</li>
          <li style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">🔥 <strong>Get spicy</strong> - Add 🌶️ to controversial takes for bonus points</li>
          <li style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">🤝 <strong>Build bridges</strong> - Find common ground and level up your score</li>
        </ul>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
        <p style="margin: 0; color: #666;">Happy debating!</p>
        <p style="margin: 5px 0 0 0; color: #8B5CF6; font-weight: bold;">The HEARD Team</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: "Welcome to HEARD! 🎯",
    html: welcomeHtml,
  });
};

// Send phase change notifications to room participants
const sendPhaseChangeNotifications = async (
  room: DebateRoom,
  newPhase: Phase,
  newSubPhase?: SubPhase,
  hostId?: string,
) => {
  try {
    console.log(
      `Preparing notifications for phase change: ${newPhase}${newSubPhase ? `:${newSubPhase}` : ""}`,
    );

    // Get all participants except the host
    const participantIds = room.participants.filter(
      (id) => id !== hostId,
    );

    if (participantIds.length === 0) {
      console.log("No participants to notify (excluding host)");
      return;
    }

    // Get participant details (excluding test users)
    const participants = [];
    for (const participantId of participantIds) {
      const user = await getUserSession(participantId);
      if (user && user.email) {
        // Skip test users to avoid sending emails to fake addresses
        if (!user.isTestUser) {
          participants.push(user);
        } else {
          console.log(
            "Skipping phase change email for test user:",
            user.email,
          );
        }
      }
    }

    if (participants.length === 0) {
      console.log("No participants with email addresses found");
      return;
    }

    // Generate notification content based on phase/subphase
    const notification = getPhaseChangeNotificationContent(
      room,
      newPhase,
      newSubPhase,
    );

    // Send emails to all participants
    const emailPromises = participants.map(
      async (participant) => {
        const success = await sendEmail({
          to: participant.email,
          subject: notification.subject,
          html: getPhaseChangeEmailHtml(
            participant,
            room,
            notification,
          ),
          text: getPhaseChangeEmailText(
            participant,
            room,
            notification,
          ),
        });

        if (success) {
          console.log(
            `Phase change notification sent to ${participant.email}`,
          );
        } else {
          console.error(
            `Failed to send phase change notification to ${participant.email}`,
          );
        }

        return success;
      },
    );

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value === true,
    ).length;
    console.log(
      `Sent ${successful}/${participants.length} phase change notifications`,
    );
  } catch (error) {
    console.error(
      "Error sending phase change notifications:",
      error,
    );
  }
};

// Generate notification content based on phase/subphase
const getPhaseChangeNotificationContent = (
  room: DebateRoom,
  phase: Phase,
  subPhase?: SubPhase,
) => {
  const phaseNames: Record<Phase, string> = {
    lobby: "Lobby",
    round1: "Round 1",
    round2: "Round 2",
    round3: "Round 3",
    results: "Final Results",
  };

  const subPhaseNames: Record<SubPhase, string> = {
    posting: "Statement Posting",
    voting: "Voting",
    review: "Review",
  };

  const phaseName = phaseNames[phase];
  const subPhaseName = subPhase
    ? subPhaseNames[subPhase]
    : null;

  // Generate appropriate notification based on phase/subphase
  if (phase === "round1" && subPhase === "posting") {
    return {
      subject: `🎯 Debate started: "${room.topic}"`,
      title: "The Debate Has Begun!",
      message:
        "Round 1 is now open for statement posting. Share your thoughts and arguments!",
      action: "Submit Your Statement",
      phaseDescription: "Time to make your opening arguments",
    };
  }

  if (subPhase === "voting") {
    return {
      subject: `📊 Voting time in "${room.topic}"`,
      title: `${phaseName} Voting Phase`,
      message:
        "Statement submission is closed. Now it's time to vote on the contributions from this round!",
      action: "Cast Your Votes",
      phaseDescription:
        "Review statements and vote on the best arguments",
    };
  }

  if (subPhase === "review") {
    return {
      subject: `📋 Review phase in "${room.topic}"`,
      title: `${phaseName} Review Phase`,
      message:
        "Check out the voting results and see how arguments performed in this round.",
      action: "View Results",
      phaseDescription:
        "See which arguments resonated most with participants",
    };
  }

  if (phase === "round2" && subPhase === "posting") {
    return {
      subject: `🔥 Round 2 started in "${room.topic}"`,
      title: "Round 2 is Here!",
      message:
        "Time for the next round of statements. Build on what you've learned so far!",
      action: "Submit Round 2 Statement",
      phaseDescription:
        "Deepen the discussion with refined arguments",
    };
  }

  if (phase === "round3" && subPhase === "posting") {
    return {
      subject: `🎯 Final round in "${room.topic}"`,
      title: "Final Round - Round 3!",
      message:
        "This is your last chance to make your case. Make it count!",
      action: "Submit Final Statement",
      phaseDescription:
        "Your final opportunity to influence the debate",
    };
  }

  if (phase === "results") {
    return {
      subject: `🏆 Results are in for "${room.topic}"`,
      title: "Debate Complete!",
      message:
        "The debate has concluded. Check out the final results and see how everyone performed!",
      action: "View Final Results",
      phaseDescription:
        "See the complete debate results and participant scores",
    };
  }

  // Fallback for other combinations
  return {
    subject: `📢 ${phaseName}${subPhaseName ? ` - ${subPhaseName}` : ""} in "${room.topic}"`,
    title: `${phaseName}${subPhaseName ? ` - ${subPhaseName}` : ""}`,
    message: `The debate has moved to a new phase. Join now to participate!`,
    action: "Join Debate",
    phaseDescription: "The debate continues with a new phase",
  };
};

// Generate HTML email for phase change notifications
const getPhaseChangeEmailHtml = (
  participant: UserSession,
  room: DebateRoom,
  notification: {
    subject: string;
    title: string;
    message: string;
    action: string;
    phaseDescription: string;
  },
) => {
  const roomLink = `${Deno.env.get("FRONTEND_URL") || "https://app.heard-now.com"}/room/${room.id}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 2.5rem; font-weight: bold;">HEARD</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 1.1rem;">${notification.title}</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
          <h2 style="color: #667eea; margin-top: 0;">Hey ${participant.nickname}! 👋</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 0; font-size: 1.1rem; font-weight: 500;">"${room.topic}"</p>
          </div>
          
          <p style="font-size: 1.1rem; margin: 20px 0;">${notification.message}</p>
          
          <div style="background: #e8f2ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #0066cc; font-weight: 500;">📍 ${notification.phaseDescription}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${roomLink}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      text-decoration: none; 
                      padding: 15px 30px; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 1.1rem;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              ${notification.action}
            </a>
          </div>
          
          <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; color: #6c757d; font-size: 0.9rem;">
            <p style="margin: 10px 0;">Don't want to miss future updates? HEARD will notify you when each phase begins so you can stay engaged with the debate!</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #adb5bd; font-size: 0.8rem;">
            <p>Can't click the button? Copy and paste this link: ${roomLink}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Generate text email for phase change notifications
const getPhaseChangeEmailText = (
  participant: UserSession,
  room: DebateRoom,
  notification: {
    subject: string;
    title: string;
    message: string;
    action: string;
    phaseDescription: string;
  },
) => {
  const roomLink = `${Deno.env.get("FRONTEND_URL") || "https://app.heard-now.com"}/room/${room.id}`;

  return `
HEARD - ${notification.title}

Hey ${participant.nickname}!

"${room.topic}"

${notification.message}

${notification.phaseDescription}

${notification.action}: ${roomLink}

Don't want to miss future updates? HEARD will notify you when each phase begins so you can stay engaged with the debate!
  `.trim();
};

const getUserSession = async (
  userId: string,
): Promise<UserSession | null> => {
  try {
    const session = await kv.get(`user:${userId}`);
    if (!session) return null;
    const userData = JSON.parse(session);

    // Default isTestUser to false for existing users without this field
    if (userData.isTestUser === undefined) {
      userData.isTestUser = false;
    }

    return userData;
  } catch (error) {
    console.error(
      `Error parsing user session for ${userId}:`,
      error,
    );
    return null;
  }
};

const saveUserSession = async (session: UserSession) => {
  await kv.set(`user:${session.id}`, JSON.stringify(session));
  // Also store by email for lookup
  await kv.set(`user_email:${session.email}`, session.id);
};

const getUserByEmail = async (
  email: string,
): Promise<UserSession | null> => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const userId = await kv.get(
      `user_email:${normalizedEmail}`,
    );
    if (!userId) return null;

    return await getUserSession(userId);
  } catch (error) {
    console.error(
      `Error fetching user by email ${email}:`,
      error,
    );
    return null;
  }
};

const getUserByNickname = async (
  nickname: string,
): Promise<UserSession | null> => {
  try {
    // Get all users and find by nickname
    // This is not the most efficient, but works for our small-scale test environment
    const userKeys = await kv.getByPrefix("user:");
    for (const userJson of userKeys) {
      try {
        const user = JSON.parse(userJson);
        if (user.nickname === nickname) {
          return user;
        }
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
      }
    }
    return null;
  } catch (error) {
    console.error(
      `Error fetching user by nickname ${nickname}:`,
      error,
    );
    return null;
  }
};

const getDebateRoom = async (
  roomId: string,
): Promise<DebateRoom | null> => {
  try {
    const room = await kv.get(`room:${roomId}`);
    if (!room) return null;
    const parsedRoom = JSON.parse(room);
    // Default to host-controlled mode for existing rooms that don't have mode set
    if (!parsedRoom.mode) {
      parsedRoom.mode = "host-controlled";
    }
    return parsedRoom;
  } catch (error) {
    console.error(
      `Error parsing room data for ${roomId}:`,
      error,
    );
    return null;
  }
};

const saveDebateRoom = async (room: DebateRoom) => {
  await kv.set(`room:${room.id}`, JSON.stringify(room));
  // Also save to active rooms list if active
  if (room.isActive) {
    await kv.set(
      `active_room:${room.id}`,
      JSON.stringify(room),
    );
  } else {
    await kv.del(`active_room:${room.id}`);
  }
};

// Vote utility functions
const saveVote = async (vote: Vote) => {
  await kv.set(
    `vote:${vote.statementId}:${vote.userId}`,
    JSON.stringify(vote),
  );
};

const bulkSaveVotes = async (votes: Vote[]) => {
  const items = votes.map((vote) => ({
    key: `vote:${vote.statementId}:${vote.userId}`,
    value: JSON.stringify(vote),
  }));
  await kv.bulkSet(items);
};

const deleteVote = async (
  statementId: string,
  userId: string,
) => {
  await kv.del(`vote:${statementId}:${userId}`);
};

const getVotesForStatement = async (
  statementId: string,
): Promise<Vote[]> => {
  try {
    const votes = await kv.getByPrefix(`vote:${statementId}:`);
    return votes
      .map((v) => {
        try {
          return JSON.parse(v);
        } catch (error) {
          console.error("Error parsing vote:", v, error);
          return null;
        }
      })
      .filter((v) => v !== null);
  } catch (error) {
    console.error(
      `Error fetching votes for statement ${statementId}:`,
      error,
    );
    return [];
  }
};

const getVotesForStatements = async (
  statementIds: string[],
): Promise<{ [statementId: string]: Vote[] }> => {
  const allVotes: { [statementId: string]: Vote[] } = {};

  // Fetch votes for each statement individually to avoid hitting 1000-item limits
  // This is more efficient than fetching all votes and filtering
  for (const statementId of statementIds) {
    try {
      const votes = await getVotesForStatement(statementId);
      allVotes[statementId] = votes;
    } catch (error) {
      console.error(
        `Error fetching votes for statement ${statementId}:`,
        error,
      );
      allVotes[statementId] = []; // Ensure we have an empty array
    }
  }

  return allVotes;
};

const calculateVoteStats = (
  votes: Vote[],
): {
  agrees: number;
  disagrees: number;
  passes: number;
  superAgrees: number;
  voters: { [userId: string]: VoteType };
} => {
  const voters: {
    [userId: string]: VoteType;
  } = {};
  let agreeCount = 0;
  let disagreeCount = 0;
  let passCount = 0;
  let superAgreeCount = 0;

  for (const vote of votes) {
    voters[vote.userId] = vote.voteType;
    if (vote.voteType === "agree") {
      agreeCount++;
    } else if (vote.voteType === "disagree") {
      disagreeCount++;
    } else if (vote.voteType === "pass") {
      passCount++;
    } else if (vote.voteType === "super_agree") {
      superAgreeCount++;
      // Also count super_agree toward the regular agree count for now
      agreeCount++;
    }
  }

  return {
    agrees: agreeCount,
    disagrees: disagreeCount,
    passes: passCount,
    superAgrees: superAgreeCount,
    voters,
  };
};

const getStatements = async (
  roomId: string,
): Promise<Statement[]> => {
  try {
    const statements = await kv.getByPrefix(
      `statement:${roomId}:`,
    );
    const parsedStatements = statements
      .map((s) => {
        try {
          return JSON.parse(s);
        } catch (error) {
          console.error("Error parsing statement:", s, error);
          return null;
        }
      })
      .filter((s) => s !== null);

    // Get all statement IDs
    const statementIds = parsedStatements.map((s) => s.id);

    // Fetch votes for all statements at once
    const allVotes = await getVotesForStatements(statementIds);

    // Update each statement with calculated vote data
    const statementsWithVotes = parsedStatements.map(
      (statement) => {
        const votes = allVotes[statement.id] || [];
        const voteStats = calculateVoteStats(votes);

        return {
          ...statement,
          agrees: voteStats.agrees,
          disagrees: voteStats.disagrees,
          passes: voteStats.passes,
          superAgrees: voteStats.superAgrees,
          voters: voteStats.voters,
        };
      },
    );

    return statementsWithVotes.sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  } catch (error) {
    console.error(
      `Error fetching statements for room ${roomId}:`,
      error,
    );
    return [];
  }
};

const saveStatement = async (statement: Statement) => {
  await kv.set(
    `statement:${statement.roomId}:${statement.id}`,
    JSON.stringify(statement),
  );
};

const bulkSaveStatements = async (statements: Statement[]) => {
  const items = statements.map((statement) => ({
    key: `statement:${statement.roomId}:${statement.id}`,
    value: JSON.stringify(statement),
  }));
  await kv.bulkSet(items);
};

// Rant utility functions
const saveRant = async (rant: Rant) => {
  await kv.set(
    `rant:${rant.roomId}:${rant.id}`,
    JSON.stringify(rant),
  );
};

const getRantsForRoom = async (
  roomId: string,
): Promise<Rant[]> => {
  try {
    const rants = await kv.getByPrefix(`rant:${roomId}:`);
    return rants
      .map((r) => {
        try {
          return JSON.parse(r);
        } catch (error) {
          console.error("Error parsing rant:", r, error);
          return null;
        }
      })
      .filter((r) => r !== null)
      .sort((a, b) => a.timestamp - b.timestamp); // Chronological order
  } catch (error) {
    console.error(
      `Error fetching rants for room ${roomId}:`,
      error,
    );
    return [];
  }
};

// Generate 3-5 statements for a single rant
const generateStatementsFromRant = async (
  rant: Rant,
  topic: string,
  apiKey: string,
  index: number,
): Promise<{
  statements: string[];
  author: string;
}> => {
  const truncatedText = rant.text.substring(0, 400); // Slightly more context for better statements

  const prompt = `Topic: "${topic}"
Author: ${rant.author}
Rant: ${truncatedText}

Generate 3-5 debate statements based on this person's rant.

STRICT Rules:
- Use the author's actual words and phrases whenever possible
- Do NOT add interpretations, implications, or extra meaning
- Do NOT extrapolate beyond what they explicitly said
- Stay faithful to their tone (casual, formal, emotional, etc.)
- Only create statements for arguments they actually made
- Keep their specific examples and concerns intact
- If they used simple language, keep it simple
- If they were emotional, preserve that emotion

Return only the statements, one per line. Don't include any explanations, extra text, or prefixes.`;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a faithful content editor. Transform raw rants into clean debate statements while preserving the author's exact words, tone, and meaning. Do not add interpretations or extrapolate beyond what was actually said.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 400,
          temperature: 0.1,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    const statements = parseStatements(content);
    console.log(
      `Rant ${index + 1}/${rant.author}: Generated ${statements.length} statements`,
    );

    return { statements, author: rant.author };
  } catch (error) {
    console.error(
      `Error processing rant ${index + 1} (${rant.author}):`,
      error,
    );
    // Return fallback to avoid breaking the entire compilation
    return {
      statements: [
        `The ${topic} debate raises important questions about community priorities.`,
      ],
      author: rant.author,
    };
  }
};

// Parse statements from AI response
const parseStatements = (content: string): string[] => {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines;
};

// Process a single rant immediately and create statements
const processRantAndCreateStatements = async (
  rant: Rant,
  topic: string,
  roomId: string,
): Promise<Statement[]> => {
  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not found in environment");
      throw new Error("AI service not configured");
    }

    console.log(
      `Processing rant from ${rant.author} for topic: ${topic}`,
    );

    // Generate statements from this rant
    const aiStartTime = Date.now();
    const result = await generateStatementsFromRant(
      rant,
      topic,
      openaiApiKey,
      0, // index not important for single rant processing
    );
    const aiEndTime = Date.now();

    console.log(
      `AI generated ${result.statements.length} statements from rant in ${aiEndTime - aiStartTime}ms`,
    );

    // Create statement objects
    const baseTimestamp = Date.now();
    const statements: Statement[] = [];

    for (
      let index = 0;
      index < result.statements.length;
      index++
    ) {
      const statementId = generateId();
      const statement: Statement = {
        id: statementId,
        text: result.statements[index],
        author: rant.author, // Use the rant author's name
        agrees: 0,
        disagrees: 0,
        passes: 0,
        roomId: roomId,
        timestamp: baseTimestamp + index,
        round: 1, // Rants are processed during lobby/round1
        voters: {},
      };
      statements.push(statement);
    }

    // Save all statements
    await bulkSaveStatements(statements);

    console.log(
      `Successfully saved ${statements.length} statements from ${rant.author}'s rant`,
    );

    return statements;
  } catch (error) {
    console.error(
      `Error processing rant from ${rant.author}:`,
      error,
    );
    throw error;
  }
};

// Create or join user session
app.post("/make-server-f1a393b4/user/create", async (c) => {
  try {
    const { nickname, email } = await c.req.json();

    if (
      !nickname ||
      nickname.length < 2 ||
      nickname.length > 20
    ) {
      return c.json(
        { error: "Nickname must be 2-20 characters" },
        400,
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json(
        { error: "Valid email address is required" },
        400,
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists with this email
    const existingUser = await getUserByEmail(normalizedEmail);

    if (existingUser) {
      console.log(
        `Existing user found for email ${normalizedEmail}, logging them back in`,
      );

      // Update their last active time and return existing user
      existingUser.lastActive = Date.now();
      await saveUserSession(existingUser);

      return c.json({
        user: existingUser,
        isReturningUser: true,
      });
    }

    // Create new user if email doesn't exist
    console.log(
      `Creating new user for email ${normalizedEmail}`,
    );
    const userId = generateId();
    const userSession: UserSession = {
      id: userId,
      nickname: nickname.substring(0, 20), // Ensure max length
      email: normalizedEmail,
      score: 0,
      streak: 0,
      lastActive: Date.now(),
      isTestUser: false, // Real users are not test users
      isDeveloper: false,
    };

    await saveUserSession(userSession);

    // Send welcome email only for real users, not test users (don't block user creation if email fails)
    if (!userSession.isTestUser) {
      sendWelcomeEmail(
        userSession.email,
        userSession.nickname,
      ).catch((error) => {
        console.error(
          "Welcome email failed for user:",
          userId,
          error,
        );
      });
    } else {
      console.log(
        "Skipping welcome email for test user:",
        userSession.email,
      );
    }

    return c.json({
      user: userSession,
      isReturningUser: false,
    });
  } catch (error) {
    console.error("Error creating user session:", error);
    return c.json(
      { error: "Failed to create user session" },
      500,
    );
  }
});

// Get user session
app.get("/make-server-f1a393b4/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const user = await getUserSession(userId);

    if (!user) {
      return c.json({ error: "User session not found" }, 404);
    }

    // Update last active
    user.lastActive = Date.now();
    await saveUserSession(user);

    return c.json({ user });
  } catch (error) {
    console.error("Error fetching user session:", error);
    return c.json(
      { error: "Failed to fetch user session" },
      500,
    );
  }
});

// Create debate room
app.post("/make-server-f1a393b4/room/create", async (c) => {
  try {
    const {
      topic,
      description,
      userId,
      mode = "host-controlled",
      rantFirst = false,
      subHeard,
    } = await c.req.json();

    if (!topic || topic.length < 10) {
      return c.json(
        { error: "Topic must be at least 10 characters" },
        400,
      );
    }

    const user = await getUserSession(userId);
    if (!user) {
      return c.json({ error: "User session not found" }, 404);
    }

    // If creating a room in a private sub-heard, check membership
    if (subHeard) {
      const normalizedSubHeard = subHeard
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
      const subHeardKey = `subheard:${normalizedSubHeard}`;
      const subHeardData = await kv.get(subHeardKey);

      if (subHeardData) {
        try {
          const parsedSubHeard = JSON.parse(subHeardData);
          if (parsedSubHeard.isPrivate) {
            // Check if user is admin or member
            const isAdmin = parsedSubHeard.adminId === userId;
            const membershipKey = `subheard_member:${userId}:${normalizedSubHeard}`;
            const isMember = await kv.get(membershipKey);

            if (!isAdmin && !isMember) {
              return c.json(
                {
                  error:
                    "You must be a member of this private sub-heard to create rooms",
                },
                403,
              );
            }
          }
        } catch (error) {
          console.error(
            "Error checking sub-heard membership:",
            error,
          );
        }
      }
    }

    const roomId = generateId();
    const debateRoom: DebateRoom = {
      id: roomId,
      topic: topic.substring(0, 500), // Limit topic length
      description: description
        ? description.substring(0, 2000)
        : undefined, // Optional description with limit
      phase: rantFirst ? "round1" : "lobby", // Rant-first rooms start in round1
      subPhase: rantFirst ? "posting" : undefined, // Rant-first rooms start in posting phase
      gameNumber: 1,
      roundStartTime: Date.now(),
      participants: [userId],
      hostId: userId, // Set the creator as the host
      isActive: true,
      createdAt: Date.now(),
      mode: mode as DebateMode,
      rantFirst: rantFirst,
      subHeard: subHeard
        ? subHeard.trim().toLowerCase().replace(/\s+/g, "-")
        : undefined,
    };

    await saveDebateRoom(debateRoom);

    // Update user's current room
    user.currentRoomId = roomId;
    await saveUserSession(user);

    return c.json({ room: debateRoom });
  } catch (error) {
    console.error("Error creating debate room:", error);
    return c.json(
      { error: "Failed to create debate room" },
      500,
    );
  }
});

// Join debate room
app.post(
  "/make-server-f1a393b4/room/:roomId/join",
  async (c) => {
    try {
      const roomId = c.req.param("roomId");
      const { userId } = await c.req.json();

      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      if (!room.isActive) {
        return c.json(
          { error: "Room is no longer active" },
          400,
        );
      }

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // If joining a room in a private sub-heard, check membership
      if (room.subHeard) {
        const subHeardKey = `subheard:${room.subHeard}`;
        const subHeardData = await kv.get(subHeardKey);

        if (subHeardData) {
          try {
            const parsedSubHeard = JSON.parse(subHeardData);
            if (parsedSubHeard.isPrivate) {
              // Check if user is admin or member
              const isAdmin = parsedSubHeard.adminId === userId;
              const membershipKey = `subheard_member:${userId}:${room.subHeard}`;
              const isMember = await kv.get(membershipKey);

              if (!isAdmin && !isMember) {
                return c.json(
                  {
                    error:
                      "You must be a member of this private sub-heard to join rooms",
                  },
                  403,
                );
              }
            }
          } catch (error) {
            console.error(
              "Error checking sub-heard membership:",
              error,
            );
          }
        }
      }

      // Add user to participants if not already there
      if (!room.participants.includes(userId)) {
        room.participants.push(userId);
        await saveDebateRoom(room);
      }

      // Update user's current room
      user.currentRoomId = roomId;
      await saveUserSession(user);

      return c.json({ room });
    } catch (error) {
      console.error("Error joining debate room:", error);
      return c.json(
        { error: "Failed to join debate room" },
        500,
      );
    }
  },
);

// Get room status
app.get("/make-server-f1a393b4/room/:roomId", async (c) => {
  try {
    const roomId = c.req.param("roomId");

    if (!roomId) {
      return c.json({ error: "Room ID is required" }, 400);
    }

    const room = await getDebateRoom(roomId);

    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }

    const statements = await getStatements(roomId);

    // Get rants if this is a rant-first room
    const rants = room.rantFirst
      ? await getRantsForRoom(roomId)
      : [];

    return c.json({
      room,
      statements,
      rants,
      participantCount: room.participants?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching room status:", error);
    return c.json(
      {
        error: "Failed to fetch room status",
        details: error.message,
      },
      500,
    );
  }
});

// Submit statement
app.post(
  "/make-server-f1a393b4/room/:roomId/statement",
  async (c) => {
    try {
      const roomId = c.req.param("roomId");
      const { text, userId } = await c.req.json();

      if (!text || text.length < 5 || text.length > 500) {
        return c.json(
          { error: "Statement must be 5-500 characters" },
          400,
        );
      }

      const room = await getDebateRoom(roomId);
      if (!room || !room.isActive) {
        return c.json(
          { error: "Room not found or inactive" },
          404,
        );
      }

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // Auto-join user to room if they're not already a participant
      if (!room.participants.includes(userId)) {
        room.participants.push(userId);
        await saveDebateRoom(room);
        console.log(
          `Auto-added user ${userId} to room ${roomId} via statement submission`,
        );
      }

      // Convert phase to round number
      const getRoundNumber = (phase: Phase): number => {
        switch (phase) {
          case "round1":
            return 1;
          case "round2":
            return 2;
          case "round3":
            return 3;
          default:
            return 1; // Fallback to round 1
        }
      };

      const statement: Statement = {
        id: generateId(),
        text: text.trim(),
        author: user.nickname,
        agrees: 0, // Will be calculated from Vote records
        disagrees: 0, // Will be calculated from Vote records
        passes: 0, // Will be calculated from Vote records
        superAgrees: 0, // Will be calculated from Vote records
        type: undefined, // Will be calculated on backend later
        isSpicy: text.includes("🌶️") || text.length > 200,
        roomId,
        timestamp: Date.now(),
        round: getRoundNumber(room.phase),
        voters: {}, // Will be calculated from Vote records
      };

      await saveStatement(statement);

      // Award points to user
      const basePoints = 50;
      const spicyBonus = statement.isSpicy ? 25 : 0;
      const totalPoints = basePoints + spicyBonus;

      user.score += totalPoints;
      user.streak += 1;

      await saveUserSession(user);

      return c.json({
        statement,
        pointsEarned: totalPoints,
        achievement: {
          title: "Statement Posted!",
          description: `+${totalPoints} points`,
          points: totalPoints,
          type: "score",
        },
      });
    } catch (error) {
      console.error("Error submitting statement:", error);
      return c.json(
        { error: "Failed to submit statement" },
        500,
      );
    }
  },
);

// Submit rant
app.post(
  "/make-server-f1a393b4/room/:roomId/rant",
  async (c) => {
    try {
      const roomId = c.req.param("roomId");
      const { text, userId } = await c.req.json();

      if (!text || text.trim().length < 50) {
        return c.json(
          { error: "Rant must be at least 50 characters" },
          400,
        );
      }

      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      if (!room.rantFirst) {
        return c.json(
          { error: "This room does not support rants" },
          400,
        );
      }

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // Auto-join user to room if they're not already a participant
      if (!room.participants.includes(userId)) {
        room.participants.push(userId);
        await saveDebateRoom(room);
        console.log(
          `Auto-added user ${userId} to room ${roomId} via rant submission`,
        );
      }

      // Check if user has already submitted a rant
      const existingRants = await getRantsForRoom(roomId);
      const userHasRant = existingRants.some(
        (rant) => rant.author === user.nickname,
      );

      if (userHasRant) {
        return c.json(
          {
            error:
              "You have already submitted a rant for this debate",
          },
          400,
        );
      }

      const rant: Rant = {
        id: generateId(),
        text: text.trim(),
        author: user.nickname,
        roomId,
        timestamp: Date.now(),
      };

      await saveRant(rant);

      // Immediately process the rant and create statements
      try {
        const statements = await processRantAndCreateStatements(
          rant,
          room.topic,
          roomId,
        );

        return c.json({
          rant,
          statements,
          message: `Rant submitted and ${statements.length} statements created successfully`,
        });
      } catch (aiError) {
        console.error(
          "Error processing rant with AI:",
          aiError,
        );
        // Rant was saved, but AI processing failed
        return c.json({
          rant,
          statements: [],
          message:
            "Rant submitted, but AI processing failed. Statements will be generated later.",
          warning: "AI processing error",
        });
      }
    } catch (error) {
      console.error("Error submitting rant:", error);
      return c.json({ error: "Failed to submit rant" }, 500);
    }
  },
);

// Vote on statement
app.post(
  "/make-server-f1a393b4/statement/:statementId/vote",
  async (c) => {
    try {
      const statementId = c.req.param("statementId");
      const { voteType, userId } = await c.req.json();

      if (
        !["agree", "disagree", "pass", "super_agree"].includes(
          voteType,
        )
      ) {
        return c.json({ error: "Invalid vote type" }, 400);
      }

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // Fetch statement using LIKE pattern (statement:%:statementId)
      const statement = await getStatementById(statementId);

      if (!statement) {
        console.error(
          `Statement not found with ID: ${statementId}`,
        );
        return c.json({ error: "Statement not found" }, 404);
      }
      console.log(
        `Voting on statement ${statementId} by user ${userId} with vote ${voteType}`,
      );

      // Auto-join user to room if they're not already a participant
      const room = await getDebateRoom(statement.roomId);
      if (room && !room.participants.includes(userId)) {
        room.participants.push(userId);
        await saveDebateRoom(room);
        console.log(
          `Auto-added user ${userId} to room ${statement.roomId} via voting`,
        );
      }

      // Get current vote if it exists
      const currentVotes =
        await getVotesForStatement(statementId);
      const currentVote = currentVotes.find(
        (v) => v.userId === userId,
      );
      let pointsEarned = 0;

      if (currentVote?.voteType === voteType) {
        // Same vote type - undo vote (delete the vote record)
        await deleteVote(statementId, userId);
        console.log(
          `Removed vote for user ${userId} on statement ${statementId}`,
        );
        // No points change for undoing
      } else if (
        currentVote &&
        currentVote.voteType !== voteType
      ) {
        // Different vote type - update existing vote
        const updatedVote: Vote = {
          ...currentVote,
          voteType,
          timestamp: Date.now(),
        };
        await saveVote(updatedVote);
        console.log(
          `Updated vote for user ${userId} on statement ${statementId} to ${voteType}`,
        );

        if (
          voteType === "agree" ||
          voteType === "super_agree"
        ) {
          pointsEarned = 10; // Award points for agreeing
        }
      } else {
        // First time voting - create new vote record
        const newVote: Vote = {
          id: generateId(),
          statementId,
          userId,
          voteType,
          timestamp: Date.now(),
        };
        await saveVote(newVote);
        console.log(
          `Created new vote for user ${userId} on statement ${statementId}: ${voteType}`,
        );

        if (
          voteType === "agree" ||
          voteType === "super_agree"
        ) {
          pointsEarned = 10; // Award points for agreeing
        }
      }

      // Get updated vote data to return
      const updatedVotes =
        await getVotesForStatement(statementId);
      const voteStats = calculateVoteStats(updatedVotes);

      // Update statement with calculated vote data (but don't save it - votes are separate)
      const updatedStatement = {
        ...statement,
        agrees: voteStats.agrees,
        disagrees: voteStats.disagrees,
        passes: voteStats.passes,
        superAgrees: voteStats.superAgrees,
        voters: voteStats.voters,
      };

      console.log(
        `Final vote count for statement ${statementId}: ${voteStats.agrees} agree, ${voteStats.disagrees} disagree, ${voteStats.passes} pass (${updatedVotes.length} total votes)`,
      );

      // Update user points
      if (pointsEarned > 0) {
        user.score += pointsEarned;
        await saveUserSession(user);
      }

      // Trigger clustering recalculation for the room
      try {
        await recalculateClustersForRoom(statement.roomId);
      } catch (clusterError) {
        console.error(
          "[Clustering] Error during clustering recalculation:",
          clusterError,
        );
        // Don't fail the vote if clustering fails
      }

      return c.json({
        statement: updatedStatement,
        pointsEarned,
        userVote: voteStats.voters[userId] || null,
      });
    } catch (error) {
      console.error("Error voting on statement:", error);
      return c.json(
        { error: "Failed to vote on statement" },
        500,
      );
    }
  },
);

// Update room phase
app.post(
  "/make-server-f1a393b4/room/:roomId/phase",
  async (c) => {
    try {
      const roomId = c.req.param("roomId");
      const { phase, subPhase, userId } = await c.req.json();
      console.log(
        `Phase update request: roomId=${roomId}, phase=${phase}, subPhase=${subPhase}, userId=${userId}`,
      );

      const validPhases = [
        "lobby",
        "round1",
        "round2",
        "round3",
        "results",
      ];
      const validSubPhases: SubPhase[] = [
        "posting",
        "voting",
        "review",
      ];

      if (!validPhases.includes(phase)) {
        console.log(
          `Invalid phase received: ${phase}. Valid phases:`,
          validPhases,
        );
        return c.json(
          {
            error: `Invalid phase: ${phase}. Valid phases: ${validPhases.join(", ")}`,
          },
          400,
        );
      }

      if (subPhase && !validSubPhases.includes(subPhase)) {
        return c.json({ error: "Invalid subPhase" }, 400);
      }

      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      const user = await getUserSession(userId);
      if (!user || !room.participants.includes(userId)) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      // Only the host can change phases
      if (room.hostId !== userId) {
        return c.json(
          {
            error:
              "Only the room host can control the debate phases",
          },
          403,
        );
      }

      // Update room phase and subphase
      room.phase = phase as Phase;
      room.subPhase = subPhase;
      room.roundStartTime = Date.now();

      // If moving to results, increment game number
      if (phase === "results") {
        room.gameNumber += 1;
      }

      await saveDebateRoom(room);

      // Send email notifications for host-controlled rooms only
      if (room.mode === "host-controlled") {
        console.log(
          `Sending phase change notifications for host-controlled room ${roomId}`,
        );
        await sendPhaseChangeNotifications(
          room,
          phase,
          subPhase,
          userId,
        );
      }

      return c.json({ room });
    } catch (error) {
      console.error("Error updating room phase:", error);
      return c.json(
        { error: "Failed to update room phase" },
        500,
      );
    }
  },
);

// Update room description (host only)
app.put(
  "/make-server-f1a393b4/room/:roomId/description",
  async (c) => {
    try {
      const roomId = c.req.param("roomId");
      const { description, userId } = await c.req.json();

      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // Only the host can update the description
      if (room.hostId !== userId) {
        return c.json(
          {
            error:
              "Only the room host can update the description",
          },
          403,
        );
      }

      // Update the room description
      room.description = description
        ? description.substring(0, 2000)
        : undefined;
      await saveDebateRoom(room);

      return c.json({ room });
    } catch (error) {
      console.error("Error updating room description:", error);
      return c.json(
        { error: "Failed to update room description" },
        500,
      );
    }
  },
);

// Mark room as inactive (dev tool)
app.post(
  "/make-server-f1a393b4/room/:roomId/inactive",
  async (c) => {
    try {
      const roomId = c.req.param("roomId");
      const { userId } = await c.req.json();

      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // Only developers can mark rooms as inactive
      if (!user.isDeveloper) {
        return c.json(
          {
            error: "Only developers can mark rooms as inactive",
          },
          403,
        );
      }

      // Mark room as inactive
      room.isActive = false;
      await saveDebateRoom(room);

      // Remove from active rooms list
      await kv.del(`active_room:${room.id}`);

      return c.json({ room });
    } catch (error) {
      console.error("Error marking room as inactive:", error);
      return c.json(
        { error: "Failed to mark room as inactive" },
        500,
      );
    }
  },
);

// Get active rooms
app.get("/make-server-f1a393b4/rooms/active", async (c) => {
  try {
    const subHeard = c.req.query("subHeard");
    const userId = c.req.query("userId");

    const activeRooms = await kv.getByPrefix("active_room:");
    let rooms = activeRooms
      .map((r) => {
        try {
          return JSON.parse(r);
        } catch (error) {
          console.error("Error parsing active room:", r, error);
          return null;
        }
      })
      .filter((r) => r !== null);

    // Filter by sub-heard if specified
    if (subHeard) {
      rooms = rooms.filter((r) => r.subHeard === subHeard);
    }

    // Filter out rooms from private sub-heards where user is not a member
    if (userId) {
      // Get all user's memberships once
      const userMemberships = await getUserMemberships(userId);

      // Get all sub-heard data once
      const subHeardData = await kv.getByPrefix("subheard:");
      const subHeardMap = new Map();
      subHeardData.forEach((sh) => {
        try {
          const data = JSON.parse(sh);
          if (data.name) {
            subHeardMap.set(data.name, data);
          }
        } catch (error) {
          console.error("Error parsing sub-heard:", error);
        }
      });

      // Filter rooms based on memberships
      rooms = rooms.filter((room) => {
        const shData = subHeardMap.get(room.subHeard);
        if (!shData) {
          return false; // No sub-heard data found, exclude the room
        }

        if (!shData.isPrivate) {
          return true; // Public sub-heard, include it
        }

        // Private sub-heard - check if user is admin or member
        const isAdmin = shData.adminId === userId;
        const isMember = userMemberships.has(room.subHeard);
        return isAdmin || isMember;
      });
    }

    return c.json({ rooms });
  } catch (error) {
    console.error("Error fetching active rooms:", error);
    return c.json(
      { error: "Failed to fetch active rooms" },
      500,
    );
  }
});

// Send email invites to join a room
app.post(
  "/make-server-f1a393b4/room/:roomId/invite",
  async (c) => {
    try {
      const { emails, customMessage } = await c.req.json();
      const roomId = c.req.param("roomId");

      if (
        !emails ||
        !Array.isArray(emails) ||
        emails.length === 0
      ) {
        return c.json(
          { error: "Valid email array is required" },
          400,
        );
      }

      // Get room details
      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      if (!room.isActive) {
        return c.json({ error: "Room is not active" }, 400);
      }

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) {
        console.error("RESEND_API_KEY not configured");
        return c.json(
          { error: "Email service not configured" },
          500,
        );
      }

      const origin =
        c.req.header("origin") || "https://app.heard-now.com";
      const inviteLink = `${origin}/room/${roomId}`;

      // Create the email content
      const getEmailHtml = (email: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Join a debate on HEARD!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 2.5rem; font-weight: bold;">HEARD</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 1.1rem;">You're invited to a debate!</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea; margin-top: 0;">Join this debate:</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; font-size: 1.1rem; font-weight: 500;">"${room.topic}"</p>
            </div>
            
            ${
              customMessage
                ? `
              <div style="margin: 20px 0;">
                <h3 style="color: #495057; font-size: 1rem; margin-bottom: 10px;">Personal message:</h3>
                <p style="font-style: italic; color: #6c757d; background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 0;">"${customMessage}"</p>
              </div>
            `
                : ""
            }
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 15px 30px; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 1.1rem;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                🎯 Join the Debate
              </a>
            </div>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; color: #6c757d; font-size: 0.9rem;">
              <h3 style="color: #495057; font-size: 1rem;">What is HEARD?</h3>
              <p style="margin: 10px 0;">HEARD is a gamified debate app that makes arguing fun and educational. You'll:</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Submit statements on the debate topic</li>
                <li>Vote on other players' contributions</li>
                <li>Find bridges between different views</li>
                <li>Earn points and build streaks!</li>
              </ul>
              <p style="margin: 10px 0;">No account needed - just click the link above to get started!</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #adb5bd; font-size: 0.8rem;">
              <p>Can't click the button? Copy and paste this link: ${inviteLink}</p>
            </div>
          </div>
        </body>
      </html>
    `;

      const getEmailText = (email: string) => `
You're invited to join a debate on HEARD!

Topic: "${room.topic}"

${customMessage ? `Personal message: "${customMessage}"` : ""}

Join the debate: ${inviteLink}

What is HEARD?
HEARD is a gamified debate app that makes arguing fun and educational. You'll submit statements, vote on contributions, find bridges between views, and earn points!

No account needed - just click the link to get started!
    `;

      // Send emails using reusable function
      const emailPromises = emails.map(
        async (email: string) => {
          const success = await sendEmail({
            to: email,
            subject: `🎯 You're invited to debate: "${room.topic}"`,
            html: getEmailHtml(email),
            text: getEmailText(email),
          });

          if (!success) {
            throw new Error(`Failed to send email to ${email}`);
          }

          return { email, success: true };
        },
      );

      // Wait for all emails to be sent
      const results = await Promise.allSettled(emailPromises);

      const successful = results.filter(
        (result) => result.status === "fulfilled",
      ).length;
      const failed = results.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failed > 0) {
        console.error(
          `Failed to send ${failed} out of ${emails.length} emails`,
        );

        // If some succeeded and some failed, return partial success
        if (successful > 0) {
          return c.json({
            success: true,
            message: `Sent ${successful} invites successfully, ${failed} failed`,
            successful,
            failed,
          });
        } else {
          // All failed
          return c.json(
            { error: "Failed to send any invites" },
            500,
          );
        }
      }

      return c.json({
        success: true,
        message: `Successfully sent invites to ${emails.length} email${emails.length === 1 ? "" : "s"}`,
        count: emails.length,
      });
    } catch (error) {
      console.error("Error in send invites:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

// Create seed data for testing
app.post("/make-server-f1a393b4/seed/create", async (c) => {
  try {
    const { userId } = await c.req.json();

    const user = await getUserSession(userId);
    if (!user) {
      return c.json({ error: "User session not found" }, 404);
    }

    // Create a test room
    const roomId = generateId();
    const debateRoom: DebateRoom = {
      id: roomId,
      topic:
        "Metro escalator walking: should you always stand right, or is it okay to walk on the left side?",
      phase: "round1", // Start in round1 for immediate testing
      subPhase: "posting",
      gameNumber: 1,
      roundStartTime: Date.now(),
      participants: [
        userId,
        "test_user_1",
        "test_user_2",
        "test_user_3",
      ],
      hostId: userId, // Set the user as the host
      isActive: true,
      createdAt: Date.now(),
      subHeard: "Dupont Circle Neighborhoods",
    };

    await saveDebateRoom(debateRoom);

    // Create fake users
    const fakeUsers = [
      {
        id: "test_user_1",
        nickname: "MetroCommuter",
        email: "metro@example.com",
        score: 450,
        streak: 3,
        currentRoomId: roomId,
        lastActive: Date.now(),
        isTestUser: true,
      },
      {
        id: "test_user_2",
        nickname: "RushHourWarrior",
        email: "rushhour@example.com",
        score: 380,
        streak: 5,
        currentRoomId: roomId,
        lastActive: Date.now(),
        isTestUser: true,
      },
      {
        id: "test_user_3",
        nickname: "EscalatorEtiquette",
        email: "etiquette@example.com",
        score: 520,
        streak: 2,
        currentRoomId: roomId,
        lastActive: Date.now(),
        isTestUser: true,
      },
    ];

    // Save fake users
    for (const fakeUser of fakeUsers) {
      await saveUserSession(fakeUser);
    }

    // Create diverse statements with different types
    const statementData = [
      {
        statement: {
          id: generateId(),
          text: "Stand right, walk left - it's literally posted everywhere and keeps traffic flowing smoothly for everyone",
          author: "MetroCommuter",
          agrees: 0, // Will be calculated
          disagrees: 0, // Will be calculated
          passes: 0, // Will be calculated
          type: undefined,
          isSpicy: false,
          roomId,
          timestamp: Date.now() - 900000, // 15 min ago
          round: 1, // Current round
          voters: {}, // Will be calculated
        },
        voteData: [
          { userId, voteType: "agree" as const },
          { userId: "test_user_2", voteType: "agree" as const },
          { userId: "test_user_3", voteType: "agree" as const },
        ],
      },
      {
        statement: {
          id: generateId(),
          text: "The real issue is whether escalators are transportation or moving sidewalks - affects the whole etiquette 🌶️",
          author: "RushHourWarrior",
          agrees: 0, // Will be calculated
          disagrees: 0, // Will be calculated
          passes: 0, // Will be calculated
          type: undefined,
          isSpicy: true,
          roomId,
          timestamp: Date.now() - 800000, // 13 min ago
          round: 2, // Previous round
          voters: {}, // Will be calculated
        },
        voteData: [
          {
            userId: "test_user_1",
            voteType: "disagree" as const,
          },
          {
            userId: "test_user_3",
            voteType: "disagree" as const,
          },
        ],
      },
      {
        statement: {
          id: generateId(),
          text: "What about people with mobility issues who need to hold the handrail on both sides?",
          author: "EscalatorEtiquette",
          agrees: 0, // Will be calculated
          disagrees: 0, // Will be calculated
          passes: 0, // Will be calculated
          type: undefined,
          isSpicy: false,
          roomId,
          timestamp: Date.now() - 700000, // 11 min ago
          round: 2, // Previous round
          voters: {}, // Will be calculated
        },
        voteData: [
          { userId, voteType: "agree" as const },
          { userId: "test_user_1", voteType: "agree" as const },
        ],
      },
      {
        statement: {
          id: generateId(),
          text: "Some escalators are too narrow for two people anyway - the rule doesn't always work",
          author: user.nickname,
          agrees: 0, // Will be calculated
          disagrees: 0, // Will be calculated
          passes: 0, // Will be calculated
          isSpicy: false,
          roomId,
          timestamp: Date.now() - 600000, // 10 min ago
          round: 1, // Current round
          voters: {}, // Will be calculated
        },
        voteData: [
          { userId: "test_user_1", voteType: "agree" as const },
          { userId: "test_user_3", voteType: "agree" as const },
        ],
      },
      {
        statement: {
          id: generateId(),
          text: "If you're not walking just take the elevator!! Escalators are for MOVING PEOPLE 🌶️",
          author: "RushHourWarrior",
          agrees: 0, // Will be calculated
          disagrees: 0, // Will be calculated
          passes: 0, // Will be calculated
          isSpicy: true,
          roomId,
          timestamp: Date.now() - 500000, // 8 min ago
          round: 1, // Current round
          voters: {}, // Will be calculated
        },
        voteData: [
          { userId: "test_user_2", voteType: "agree" as const },
          { userId: "test_user_1", voteType: "pass" as const },
        ],
      },
      {
        statement: {
          id: generateId(),
          text: "Maybe we need better signage or even separate escalators for walkers vs standers?",
          author: "EscalatorEtiquette",
          agrees: 0, // Will be calculated
          disagrees: 0, // Will be calculated
          passes: 0, // Will be calculated
          type: undefined,
          isSpicy: false,
          roomId,
          timestamp: Date.now() - 400000, // 6 min ago
          round: 1, // Current round
          voters: {}, // Will be calculated
        },
        voteData: [
          { userId, voteType: "agree" as const },
          { userId: "test_user_1", voteType: "agree" as const },
          { userId: "test_user_2", voteType: "agree" as const },
        ],
      },
      {
        statement: {
          id: generateId(),
          text: "This is about respecting shared public space vs individual convenience - basic civics!",
          author: "MetroCommuter",
          agrees: 0, // Will be calculated
          disagrees: 0, // Will be calculated
          passes: 0, // Will be calculated
          type: undefined,
          isSpicy: false,
          roomId,
          timestamp: Date.now() - 300000, // 5 min ago
          round: 3, // Previous round
          voters: {}, // Will be calculated
        },
        voteData: [
          { userId: "test_user_1", voteType: "agree" as const },
          {
            userId: "test_user_3",
            voteType: "disagree" as const,
          },
          { userId, voteType: "pass" as const },
        ],
      },
      {
        statement: {
          id: generateId(),
          text: "Tourist season changes everything - they don't know the rules and clog up the system",
          author: "EscalatorEtiquette",
          agrees: 0, // Will be calculated
          disagrees: 0, // Will be calculated
          passes: 0, // Will be calculated
          type: undefined,
          isSpicy: false,
          roomId,
          timestamp: Date.now() - 200000, // 3 min ago
          round: 2, // Previous round
          voters: {}, // Will be calculated
        },
        voteData: [
          { userId, voteType: "agree" as const },
          { userId: "test_user_2", voteType: "pass" as const },
        ],
      },
    ];

    // Save all statements and their votes
    for (const { statement, voteData } of statementData) {
      await saveStatement(statement);

      // Create vote records for this statement
      for (const { userId: voterId, voteType } of voteData) {
        const vote: Vote = {
          id: generateId(),
          statementId: statement.id,
          userId: voterId,
          voteType,
          timestamp:
            statement.timestamp + Math.random() * 10000, // Slightly randomize vote times
        };
        await saveVote(vote);
      }
    }

    // Update user's current room
    user.currentRoomId = roomId;
    await saveUserSession(user);

    return c.json({
      room: debateRoom,
      statements: statementData.length,
      message:
        "Seed data created successfully! You can now join the test room.",
    });
  } catch (error) {
    console.error("Error creating seed data:", error);
    return c.json({ error: "Failed to create seed data" }, 500);
  }
});

// Create test room with Q Street debate topic and players (no posts/votes)
app.post(
  "/make-server-f1a393b4/test-room/create",
  async (c) => {
    try {
      const { userId } = await c.req.json();

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // Create a test room with Q Street farmers market topic
      const roomId = generateId();
      const debateRoom: DebateRoom = {
        id: roomId,
        topic:
          "Should Q Street be closed to traffic during the farmers market?",
        phase: "lobby", // Start in lobby so host can control the start
        subPhase: undefined,
        gameNumber: 1,
        roundStartTime: Date.now(),
        participants: [
          userId,
          "qstreet_user_1",
          "qstreet_user_2",
          "qstreet_user_3",
          "qstreet_user_4",
        ],
        hostId: userId, // Set the user as the host
        isActive: true,
        createdAt: Date.now(),
        mode: "host-controlled", // Allow host to control phases
        subHeard: "Dupont Circle Neighborhoods",
      };

      await saveDebateRoom(debateRoom);

      // Create fake users with Q Street themed names
      const fakeUsers = [
        {
          id: "qstreet_user_1",
          nickname: "LocalVendor",
          email: "vendor@qstreet.example",
          score: 250,
          streak: 1,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "qstreet_user_2",
          nickname: "NeighborhoodResident",
          email: "resident@qstreet.example",
          score: 180,
          streak: 2,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "qstreet_user_3",
          nickname: "CommutingWorker",
          email: "commuter@qstreet.example",
          score: 320,
          streak: 0,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "qstreet_user_4",
          nickname: "LocalBusiness",
          email: "business@qstreet.example",
          score: 400,
          streak: 4,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
      ];

      // Save fake users
      for (const fakeUser of fakeUsers) {
        await saveUserSession(fakeUser);
      }

      // Update user's current room
      user.currentRoomId = roomId;
      await saveUserSession(user);

      return c.json({
        room: debateRoom,
        players: fakeUsers.length + 1, // +1 for the creating user
        message:
          "Test room created successfully! Ready for Q Street farmers market debate.",
      });
    } catch (error) {
      console.error("Error creating test room:", error);
      return c.json(
        { error: "Failed to create test room" },
        500,
      );
    }
  },
);

// Create rant test room with Q Street debate topic and pre-filled rants
app.post(
  "/make-server-f1a393b4/rant-test-room/create",
  async (c) => {
    try {
      const { userId } = await c.req.json();

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // Create a rant-first test room with Q Street farmers market topic
      const roomId = generateId();
      const debateRoom: DebateRoom = {
        id: roomId,
        topic:
          "Should Q Street be closed to traffic during the farmers market?",
        phase: "round1", // Rant-first rooms start in round1
        subPhase: "posting", // Start in posting phase
        gameNumber: 1,
        roundStartTime: Date.now(),
        participants: [
          userId,
          "rant_user_1",
          "rant_user_2",
          "rant_user_3",
          "rant_user_4",
          "rant_user_5",
        ],
        hostId: userId, // Set the user as the host
        isActive: true,
        createdAt: Date.now(),
        mode: "host-controlled", // Allow host to control phases
        rantFirst: true, // This is a rant-first room
        subHeard: "Dupont Circle Neighborhoods",
      };

      await saveDebateRoom(debateRoom);

      // Create fake users with diverse backgrounds
      const fakeUsers = [
        {
          id: "rant_user_1",
          nickname: "FarmersMarketVendor",
          email: "vendor@ranttest.example",
          score: 150,
          streak: 2,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "rant_user_2",
          nickname: "QStreetResident",
          email: "resident@ranttest.example",
          score: 80,
          streak: 1,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "rant_user_3",
          nickname: "CommunityAdvocate",
          email: "advocate@ranttest.example",
          score: 200,
          streak: 3,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "rant_user_4",
          nickname: "LocalBusiness",
          email: "business@ranttest.example",
          score: 120,
          streak: 0,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "rant_user_5",
          nickname: "UrbanPlanner",
          email: "planner@ranttest.example",
          score: 300,
          streak: 5,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
      ];

      // Save fake users
      for (const fakeUser of fakeUsers) {
        await saveUserSession(fakeUser);
      }

      // Create diverse, realistic rants with different viewpoints
      const rants = [
        {
          id: generateId(),
          text: "I've been selling at this farmers market for eight years and I'm telling you we NEED to close Q Street to cars during market hours. Right now it's a disaster - we have families trying to browse produce while cars are driving right through the middle of everything. Yes, it's just a small one-way street with light traffic, but even that little bit of car traffic creates such anxiety for shoppers with kids. The current setup with the traffic light stopping cars doesn't help much because people are still nervous about getting too close to the vendor stalls. When cars come through, even slowly, everyone has to squeeze to the sides and the whole flow of the market gets disrupted. I've seen vendors having to constantly move their displays when cars need to get by. We're not asking for much - just close this one small side street for a few hours on Saturday mornings so families can actually enjoy shopping for local food without worrying about traffic. Q Street cuts right through the heart of our market space and it's the perfect length for vendors to spread out properly. The traffic can easily go around on the bigger streets. This would transform our market from a cramped sidewalk event into a proper community gathering space where people can actually relax and connect with local farmers.",
          author: "FarmersMarketVendor",
          roomId: roomId,
          timestamp: Date.now() - 600000,
        },
        {
          id: generateId(),
          text: "I live right on Q Street and I am absolutely opposed to any proposal to close our street for the farmers market. Yes, it's a smaller side street, but it's MY street and I chose to live here specifically because it provided convenient access to my building. I'm 73 years old and I depend on being able to park close to my apartment entrance. Right now the farmers market already creates chaos with all the foot traffic and people trying to park in front of my building. If they officially close the street, where am I supposed to park when I come home from grocery shopping? The nearest parking would be three blocks away. What about my neighbors who work on weekends and need to get to their cars? What about delivery drivers trying to reach us? And what about emergency access? The current setup with the traffic light at least lets residents get through when needed, but a full closure would trap us in our own neighborhood. Just because Q Street doesn't get heavy traffic doesn't mean it's not important to those of us who actually live here. The farmers market people can set up in the park or find another location. They shouldn't be able to take over our residential street just because it's convenient for them.",
          author: "QStreetResident",
          roomId: roomId,
          timestamp: Date.now() - 500000,
        },
        {
          id: generateId(),
          text: "This Q Street closure debate is bringing up so many complex issues about who gets to use public space and how. I love the farmers market and I think it's great for our community, but I also really understand the concerns from residents who live right on Q Street. The current situation isn't ideal for anyone - the market feels cramped because they're trying to work around car traffic, and residents feel like their street is being taken over even without an official closure. Maybe we need to think more creatively about solutions? Since Q Street is relatively quiet anyway, what if we had designated market hours with resident-only access permits? Or what if we created better parking alternatives for Q Street residents during market hours - like reserved spots on the next block over? I've seen other neighborhoods create compromise solutions that work for everyone. The farmers market brings so much life and community connection to our area, but we can't ignore the legitimate needs of people who chose to live on Q Street because of its accessibility. Both the market vendors and the residents deserve to feel welcome and accommodated. This doesn't have to be an all-or-nothing fight.",
          author: "CommunityAdvocate",
          roomId: roomId,
          timestamp: Date.now() - 400000,
        },
        {
          id: generateId(),
          text: "As a business owner right near Q Street, I have mixed feelings about the proposed closure for the farmers market. The market definitely brings foot traffic to the area which can be good for business, but the current setup already creates logistical headaches for me. My suppliers have trouble making deliveries on Saturday mornings because of all the market activity, and customers complain about not being able to find parking. If they officially close Q Street, I'm worried it will make things even more complicated. Right now the traffic light at least allows some vehicle access, but a full closure would mean I'd have to completely reschedule my weekend deliveries and hope customers are willing to walk further to reach my shop. On the other hand, maybe a full pedestrian zone would actually be better than the current awkward mix of cars and foot traffic? I'm not sure. I just want to make sure that any decision considers the impact on existing businesses in the area. We were here before the farmers market expanded to this size, and we need to be able to continue operating efficiently. If they do close the street, there needs to be adequate alternative access and parking for business customers and deliveries.",
          author: "LocalBusiness",
          roomId: roomId,
          timestamp: Date.now() - 300000,
        },
        {
          id: generateId(),
          text: "From an urban planning perspective, the Q Street situation is a perfect example of the tensions we face in creating more livable, human-scaled neighborhoods. Right now Q Street functions as a quiet residential one-way street that happens to cut through what could be an amazing public market space. The current compromise - keeping the street open with a traffic light - satisfies no one. Cars have to navigate slowly through crowds of people, shoppers feel unsafe around moving vehicles, and the market can't fully utilize the space. Temporary street closures for community events are a proven strategy for activating underutilized public space. Q Street isn't a major traffic artery - it's a small side street that could serve the community much better as an occasional pedestrian plaza. The key is making sure we address legitimate access needs for residents through better transit options, loading zones on adjacent streets, or even resident-only access permits during market hours. Cities across the country are experimenting with flexible street designs that can adapt to different uses throughout the week. This doesn't have to be about cars versus pedestrians - it's about designing public space that can serve multiple community needs effectively.",
          author: "UrbanPlanner",
          roomId: roomId,
          timestamp: Date.now() - 200000,
        },
      ];

      // Save all rants
      for (const rant of rants) {
        await saveRant(rant);
      }

      // Create pre-generated statements that would have come from these rants
      const baseTimestamp = Date.now();
      const statements: Statement[] = [
        // Statements from FarmersMarketVendor
        {
          id: generateId(),
          text: "We need to close Q Street to cars during market hours because families are trying to browse produce while cars drive right through the middle of everything.",
          author: "FarmersMarketVendor",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Even with light traffic on this one-way street, car traffic creates anxiety for shoppers with kids and disrupts the flow of the market.",
          author: "FarmersMarketVendor",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 1,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Closing Q Street for a few hours on Saturday mornings would transform our market from a cramped sidewalk event into a proper community gathering space.",
          author: "FarmersMarketVendor",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 2,
          round: 1,
          voters: {},
        },
        // Statements from QStreetResident
        {
          id: generateId(),
          text: "I'm 73 years old and depend on being able to park close to my apartment entrance - a full street closure would force me to park three blocks away.",
          author: "QStreetResident",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 3,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Q Street residents need to be able to get through for work, deliveries, and emergency access - the current traffic light setup at least allows that.",
          author: "QStreetResident",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 4,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Just because Q Street doesn't get heavy traffic doesn't mean it's not important to those of us who actually live here.",
          author: "QStreetResident",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 5,
          round: 1,
          voters: {},
        },
        // Statements from CommunityAdvocate
        {
          id: generateId(),
          text: "The current situation isn't ideal for anyone - the market feels cramped and residents feel like their street is being taken over.",
          author: "CommunityAdvocate",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 6,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "We could create compromise solutions like designated market hours with resident-only access permits or reserved parking spots for Q Street residents on the next block over.",
          author: "CommunityAdvocate",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 7,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Both the market vendors and the residents deserve to feel welcome and accommodated - this doesn't have to be an all-or-nothing fight.",
          author: "CommunityAdvocate",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 8,
          round: 1,
          voters: {},
        },
        // Statements from LocalBusiness
        {
          id: generateId(),
          text: "My suppliers have trouble making deliveries on Saturday mornings because of all the market activity, and customers complain about not being able to find parking.",
          author: "LocalBusiness",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 9,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "If they close the street, there needs to be adequate alternative access and parking for business customers and deliveries.",
          author: "LocalBusiness",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 10,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Maybe a full pedestrian zone would actually be better than the current awkward mix of cars and foot traffic.",
          author: "LocalBusiness",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 11,
          round: 1,
          voters: {},
        },
        // Statements from UrbanPlanner
        {
          id: generateId(),
          text: "The current compromise of keeping the street open with a traffic light satisfies no one - cars navigate through crowds, shoppers feel unsafe, and the market can't fully utilize the space.",
          author: "UrbanPlanner",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 12,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Q Street is a small side street that could serve the community much better as an occasional pedestrian plaza rather than a major traffic artery.",
          author: "UrbanPlanner",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 13,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Cities across the country are experimenting with flexible street designs that can adapt to different uses throughout the week - this is about designing public space that serves multiple community needs.",
          author: "UrbanPlanner",
          agrees: 0,
          disagrees: 0,
          passes: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 14,
          round: 1,
          voters: {},
        },
      ];

      // Save all statements
      await bulkSaveStatements(statements);

      // Update user's current room
      user.currentRoomId = roomId;
      await saveUserSession(user);

      return c.json({
        room: debateRoom,
        players: fakeUsers.length + 1, // +1 for the creating user
        rants: rants.length,
        statements: statements.length,
        message:
          "Rant test room created successfully! 5 players have already submitted detailed rants and " +
          statements.length +
          " debate statements have been generated.",
      });
    } catch (error) {
      console.error("Error creating rant test room:", error);
      return c.json(
        { error: "Failed to create rant test room" },
        500,
      );
    }
  },
);

// Create realtime test room with 5-minute countdown and seed data
app.post(
  "/make-server-f1a393b4/realtime-test-room/create",
  async (c) => {
    try {
      const { userId } = await c.req.json();

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // Create a realtime test room with a DC-specific debate topic
      const roomId = generateId();
      const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000; // 5 minutes

      const debateRoom: DebateRoom = {
        id: roomId,
        topic:
          "I wish there was a library more conveniently located north of Dupont Circle",
        phase: "round1",
        subPhase: "voting",
        gameNumber: 1,
        roundStartTime: Date.now(),
        participants: [
          userId,
          "rt_user_1",
          "rt_user_2",
          "rt_user_3",
          "rt_user_4",
        ],
        hostId: userId,
        isActive: true,
        createdAt: Date.now(),
        mode: "realtime", // Real-time mode!
        rantFirst: false,
        endTime: fiveMinutesFromNow, // Debate ends in 5 minutes
        subHeard: "Dupont Circle Neighborhoods",
      };

      await saveDebateRoom(debateRoom);

      // Create fake users with perspectives on DC library access
      const fakeUsers = [
        {
          id: "rt_user_1",
          nickname: "AdamsOrganResident",
          email: "adamsorgan@rttest.example",
          score: 150,
          streak: 2,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "rt_user_2",
          nickname: "UrbanLibrarian",
          email: "librarian@rttest.example",
          score: 200,
          streak: 3,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "rt_user_3",
          nickname: "RemoteWorkerDC",
          email: "remote@rttest.example",
          score: 120,
          streak: 1,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
        {
          id: "rt_user_4",
          nickname: "DCPLBudgetWatcher",
          email: "budget@rttest.example",
          score: 300,
          streak: 5,
          currentRoomId: roomId,
          lastActive: Date.now(),
          isTestUser: true,
        },
      ];

      // Save fake users
      for (const fakeUser of fakeUsers) {
        await saveUserSession(fakeUser);
      }

      // Create diverse statements about library access north of Dupont
      const baseTimestamp = Date.now();
      const statements: Statement[] = [
        {
          id: generateId(),
          text: "The nearest library from Columbia Heights is a 25-minute walk - that's just not accessible for families with young kids or elderly residents.",
          author: "AdamsOrganResident",
          agrees: 18,
          disagrees: 2,
          passes: 1,
          superAgrees: 4,
          roomId: roomId,
          timestamp: baseTimestamp,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "DCPL already operates 26 branches on a tight budget - we need to focus on maintaining existing libraries rather than building new ones.",
          author: "DCPLBudgetWatcher",
          agrees: 9,
          disagrees: 8,
          passes: 3,
          superAgrees: 1,
          roomId: roomId,
          timestamp: baseTimestamp + 1,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "A library branch near 14th & Park Road could serve Adams Morgan, Columbia Heights, and Mt Pleasant - three dense neighborhoods with zero library access.",
          author: "UrbanLibrarian",
          agrees: 22,
          disagrees: 1,
          passes: 0,
          superAgrees: 5,
          roomId: roomId,
          timestamp: baseTimestamp + 2,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "I'm a remote worker who would love a library workspace north of Dupont - all the coffee shops are packed and loud.",
          author: "RemoteWorkerDC",
          agrees: 16,
          disagrees: 3,
          passes: 2,
          superAgrees: 3,
          roomId: roomId,
          timestamp: baseTimestamp + 3,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Real estate costs in that area are astronomical - a new library branch would need millions in acquisition and construction funding.",
          author: "DCPLBudgetWatcher",
          agrees: 11,
          disagrees: 7,
          passes: 4,
          superAgrees: 0,
          roomId: roomId,
          timestamp: baseTimestamp + 4,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Kids in these neighborhoods shouldn't have to take two buses to get to a library for homework help or summer reading programs.",
          author: "AdamsOrganResident",
          agrees: 20,
          disagrees: 1,
          passes: 1,
          superAgrees: 4,
          roomId: roomId,
          timestamp: baseTimestamp + 5,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Mobile library services or pop-up reading rooms could serve this area at a fraction of the cost of a permanent branch.",
          author: "UrbanLibrarian",
          agrees: 13,
          disagrees: 5,
          passes: 2,
          superAgrees: 2,
          roomId: roomId,
          timestamp: baseTimestamp + 6,
          round: 1,
          voters: {},
        },
        {
          id: generateId(),
          text: "Libraries aren't just about books anymore - they're community centers, job search hubs, and safe spaces. North of Dupont needs this.",
          author: "RemoteWorkerDC",
          agrees: 19,
          disagrees: 2,
          passes: 1,
          superAgrees: 3,
          roomId: roomId,
          timestamp: baseTimestamp + 7,
          round: 1,
          voters: {},
        },
      ];

      // Save all statements
      await bulkSaveStatements(statements);

      // Update user's current room
      user.currentRoomId = roomId;
      await saveUserSession(user);

      return c.json({
        room: debateRoom,
        players: fakeUsers.length + 1,
        statements: statements.length,
        message:
          "Real-time debate room created! You have 5 minutes to vote on all statements.",
      });
    } catch (error) {
      console.error(
        "Error creating realtime test room:",
        error,
      );
      return c.json(
        { error: "Failed to create realtime test room" },
        500,
      );
    }
  },
);

// Dev endpoint: Get cluster data for a room
app.get(
  "/make-server-f1a393b4/room/:roomId/clusters",
  async (c) => {
    try {
      const roomId = c.req.param("roomId");

      const room = await getDebateRoom(roomId);
      if (!room) {
        return c.json({ error: "Room not found" }, 404);
      }

      // Get cluster metadata
      const metadataKey = `cluster:${roomId}:metadata`;
      const metadataValue = await kv.get(metadataKey);
      const metadata = metadataValue
        ? JSON.parse(metadataValue)
        : null;

      // Get all cluster assignments for participants
      const clusterKeys = room.participants.map(
        (userId) => `cluster:${roomId}:${userId}`,
      );
      const clusterValues = await kv.mget(clusterKeys);

      const assignments = room.participants.map(
        (userId, idx) => {
          const value = clusterValues[idx];
          if (!value) return { userId, cluster: null };
          try {
            const clusterData = JSON.parse(value);
            return {
              userId,
              clusterId: clusterData.clusterId,
              distance: clusterData.distance,
              timestamp: clusterData.timestamp,
            };
          } catch {
            return { userId, cluster: null };
          }
        },
      );

      return c.json({
        roomId,
        metadata,
        assignments,
        participants: room.participants.length,
      });
    } catch (error) {
      console.error("Error fetching cluster data:", error);
      return c.json(
        { error: "Failed to fetch cluster data" },
        500,
      );
    }
  },
);

// Mount subheard API routes
app.route("/", subheardApi);

export { app as debateApi };