// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

interface Statement {
  id: string;
  text: string;
  author: string;
  agrees: number; // Will be calculated from Vote records
  disagrees: number; // Will be calculated from Vote records
  passes: number; // Will be calculated from Vote records
  type?: string; // Will be calculated on backend later
  isSpicy?: boolean;
  roomId: string;
  timestamp: number;
  round: number; // Round number (1, 2, or 3)
  voters: { [userId: string]: "agree" | "disagree" | "pass" }; // Will be calculated from Vote records
}

interface Vote {
  id: string;
  statementId: string;
  userId: string;
  voteType: "agree" | "disagree" | "pass";
  timestamp: number;
}

type Phase =
  | "lobby"
  | "round1"
  | "round2"
  | "round3"
  | "results";
type SubPhase = "posting" | "voting" | "review";
type DebateMode = "realtime" | "host-controlled";

interface DebateRoom {
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
  rantFirst?: boolean; // Whether this room starts with AI-compiled rants
}

interface Rant {
  id: string;
  text: string;
  author: string;
  roomId: string;
  timestamp: number;
}

interface UserSession {
  id: string;
  nickname: string;
  email: string;
  score: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
  isTestUser?: boolean; // Flag to indicate if this is a test/fake user
}

const app = new Hono();

// Utility functions
const generateId = () =>
  Math.random().toString(36).substring(2) +
  Date.now().toString(36);

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
          console.log("Skipping phase change email for test user:", user.email);
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

  // Initialize empty arrays for all statements
  for (const id of statementIds) {
    allVotes[id] = [];
  }

  try {
    // Get all votes at once using prefix search
    const votes = await kv.getByPrefix("vote:");

    for (const voteData of votes) {
      try {
        const vote: Vote = JSON.parse(voteData);
        if (statementIds.includes(vote.statementId)) {
          allVotes[vote.statementId].push(vote);
        }
      } catch (error) {
        console.error(
          "Error parsing vote during bulk fetch:",
          voteData,
          error,
        );
      }
    }
  } catch (error) {
    console.error("Error fetching bulk votes:", error);
  }

  return allVotes;
};

const calculateVoteStats = (
  votes: Vote[],
): {
  agrees: number;
  disagrees: number;
  passes: number;
  voters: { [userId: string]: "agree" | "disagree" | "pass" };
} => {
  const voters: {
    [userId: string]: "agree" | "disagree" | "pass";
  } = {};
  let agreeCount = 0;
  let disagreeCount = 0;
  let passCount = 0;

  for (const vote of votes) {
    voters[vote.userId] = vote.voteType;
    if (vote.voteType === "agree") {
      agreeCount++;
    } else if (vote.voteType === "disagree") {
      disagreeCount++;
    } else if (vote.voteType === "pass") {
      passCount++;
    }
  }

  return {
    agrees: agreeCount,
    disagrees: disagreeCount,
    passes: passCount,
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
          voters: voteStats.voters,
        };
      },
    );

    return statementsWithVotes.sort(
      (a, b) => b.timestamp - a.timestamp,
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

// Rant utility functions
const saveRant = async (rant: Rant) => {
  await kv.set(
    `rant:${rant.roomId}:${rant.id}`,
    JSON.stringify(rant),
  );
};

const getRantsForRoom = async (roomId: string): Promise<Rant[]> => {
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

// AI compilation functionality with vote predictions
const compileRantsWithAI = async (rants: Rant[], topic: string): Promise<{
  statements: string[];
  votePredictions: { [statementIndex: number]: { [author: string]: "agree" | "disagree" | "pass" } };
}> => {
  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not found in environment");
      throw new Error("AI service not configured");
    }

    // Combine all rants into a single text
    const rantsText = rants.map(rant => 
      `${rant.author}: ${rant.text}`
    ).join("\n\n");

    const prompt = `You are helping facilitate a structured debate on the topic: "${topic}"

Here are raw, unfiltered thoughts from participants:

${rantsText}

Based on these rants, create 20-30 diverse debate statements that:
1. Capture the key arguments, concerns, and perspectives from the rants
2. Are concise and clear (1-2 sentences each)
3. Cover different viewpoints and nuances
4. Are suitable for voting (agree/disagree/pass)
5. Include both strong positions and more nuanced middle-ground perspectives
6. Maintain the authentic voice and concerns of the participants

Then, for each statement, predict how each participant would vote based on their rant content.

Return your response in this exact JSON format:
{
  "statements": [
    "Statement 1 text here",
    "Statement 2 text here"
  ],
  "votes": {
    "0": {
      "${rants[0]?.author}": "agree",
      "${rants[1]?.author}": "disagree"
    },
    "1": {
      "${rants[0]?.author}": "pass",
      "${rants[1]?.author}": "agree"
    }
  }
}

Where:
- "statements" is an array of debate statements
- "votes" has statement indices as keys
- Each vote object has participant names as keys and "agree"/"disagree"/"pass" as values
- Base predictions on how each person's rant aligns with each statement
- Use "pass" when someone would likely be neutral or when their position is unclear`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a skilled debate facilitator who analyzes participant perspectives and predicts voting behavior. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error("No content generated by AI");
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", generatedText);
      throw new Error("AI returned invalid JSON format");
    }

    const statements = parsedResponse.statements || [];
    const votePredictions = parsedResponse.votes || {};

    if (!Array.isArray(statements) || statements.length === 0) {
      throw new Error("AI did not generate valid statements");
    }

    console.log(`AI generated ${statements.length} statements and vote predictions for ${rants.length} participants`);
    return {
      statements: statements.slice(0, 30), // Ensure we don't exceed 30 statements
      votePredictions
    };

  } catch (error) {
    console.error("Error in AI compilation:", error);
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
      console.log("Skipping welcome email for test user:", userSession.email);
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
      userId,
      mode = "host-controlled",
      rantFirst = false,
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

    const roomId = generateId();
    const debateRoom: DebateRoom = {
      id: roomId,
      topic: topic.substring(0, 500), // Limit topic length
      phase: "lobby",
      gameNumber: 1,
      roundStartTime: Date.now(),
      participants: [userId],
      hostId: userId, // Set the creator as the host
      isActive: true,
      createdAt: Date.now(),
      mode: mode as DebateMode,
      rantFirst: rantFirst,
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
    console.log(`Fetching room status for: ${roomId}`);

    if (!roomId) {
      console.error("No roomId provided");
      return c.json({ error: "Room ID is required" }, 400);
    }

    const room = await getDebateRoom(roomId);
    console.log(`Room data retrieved:`, room);

    if (!room) {
      console.log(`Room ${roomId} not found`);
      return c.json({ error: "Room not found" }, 404);
    }

    const statements = await getStatements(roomId);
    console.log(
      `Found ${statements.length} statements for room ${roomId}`,
    );

    // Get rants if this is a rant-first room
    const rants = room.rantFirst ? await getRantsForRoom(roomId) : [];
    if (room.rantFirst) {
      console.log(
        `Found ${rants.length} rants for room ${roomId}`,
      );
    }

    return c.json({
      room,
      statements,
      rants,
      participantCount: room.participants?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching room status:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
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

      if (!room.participants.includes(userId)) {
        return c.json({ error: "User not in this room" }, 403);
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

      // Check if user is in the room
      if (!room.participants.includes(userId)) {
        return c.json(
          { error: "User is not a participant in this room" },
          403,
        );
      }

      // Check if user has already submitted a rant
      const existingRants = await getRantsForRoom(roomId);
      const userHasRant = existingRants.some(rant => rant.author === user.nickname);
      
      if (userHasRant) {
        return c.json(
          { error: "You have already submitted a rant for this debate" },
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

      return c.json({
        rant,
        message: "Rant submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting rant:", error);
      return c.json(
        { error: "Failed to submit rant" },
        500,
      );
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

      if (!["agree", "disagree", "pass"].includes(voteType)) {
        return c.json({ error: "Invalid vote type" }, 400);
      }

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      // Check if statement exists
      const allStatements = await kv.getByPrefix("statement:");
      const statementData = allStatements.find((s) => {
        try {
          const parsed = JSON.parse(s);
          return parsed.id === statementId;
        } catch (error) {
          console.error(
            "Error parsing statement during vote search:",
            s,
            error,
          );
          return false;
        }
      });

      if (!statementData) {
        return c.json({ error: "Statement not found" }, 404);
      }

      const statement: Statement = JSON.parse(statementData);
      console.log(
        `Voting on statement ${statementId} by user ${userId} with vote ${voteType}`,
      );

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

        if (voteType === "agree") {
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

        if (voteType === "agree") {
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

      // Special handling for rant-first rooms: compile rants into statements when starting debate
      if (room.rantFirst && room.phase === "lobby" && phase === "round1") {
        console.log("Starting rant-first debate - compiling rants with AI");
        
        try {
          const rants = await getRantsForRoom(roomId);
          console.log(`Found ${rants.length} rants to compile`);

          if (rants.length === 0) {
            return c.json(
              { error: "No rants found to compile. Players must submit rants before starting the debate." },
              400,
            );
          }

          // Generate statements and vote predictions using AI
          const aiResult = await compileRantsWithAI(rants, room.topic);
          console.log(`AI generated ${aiResult.statements.length} statements with vote predictions`);

          // Create statement objects and save them
          const statementPromises = aiResult.statements.map(async (text, index) => {
            const statementId = generateId();
            const statement: Statement = {
              id: statementId,
              text: text,
              author: "AI Compiler", // Special author to indicate AI-generated
              agrees: 0, // Will be calculated from votes
              disagrees: 0, // Will be calculated from votes  
              passes: 0, // Will be calculated from votes
              roomId: roomId,
              timestamp: Date.now() + index, // Slight offset to maintain order
              round: 1, // All AI statements go into round 1
              voters: {}, // Will be calculated from votes
            };
            
            await saveStatement(statement);

            // Save predicted votes for this statement
            const votePredictionsForStatement = aiResult.votePredictions[index.toString()];
            if (votePredictionsForStatement) {
              const votePromises = Object.entries(votePredictionsForStatement).map(async ([author, voteType]) => {
                // Find the user ID for this author
                const authorUser = await getUserByNickname(author);
                if (authorUser) {
                  const vote: Vote = {
                    id: generateId(),
                    statementId: statementId,
                    userId: authorUser.id,
                    voteType: voteType as "agree" | "disagree" | "pass",
                    timestamp: Date.now() + index + Math.random() * 1000, // Slight randomization
                  };
                  await saveVote(vote);
                  console.log(`Saved predicted vote: ${author} (${authorUser.id}) voted ${voteType} on statement ${index}`);
                }
              });
              await Promise.all(votePromises);
            }

            return statement;
          });

          await Promise.all(statementPromises);
          console.log(`Saved ${aiResult.statements.length} AI-compiled statements and their predicted votes to database`);

        } catch (error) {
          console.error("Error compiling rants with AI:", error);
          return c.json(
            { error: "Failed to compile rants with AI. Please try again." },
            500,
          );
        }
      }

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

// Get active rooms
app.get("/make-server-f1a393b4/rooms/active", async (c) => {
  try {
    const activeRooms = await kv.getByPrefix("active_room:");
    const rooms = activeRooms
      .map((r) => {
        try {
          return JSON.parse(r);
        } catch (error) {
          console.error("Error parsing active room:", r, error);
          return null;
        }
      })
      .filter((r) => r !== null);

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
app.post("/make-server-f1a393b4/test-room/create", async (c) => {
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
      topic: "Should Q Street be closed to traffic during the farmers market?",
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
      message: "Test room created successfully! Ready for Q Street farmers market debate.",
    });
  } catch (error) {
    console.error("Error creating test room:", error);
    return c.json({ error: "Failed to create test room" }, 500);
  }
});

// Create rant test room with Q Street debate topic and pre-filled rants
app.post("/make-server-f1a393b4/rant-test-room/create", async (c) => {
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
      topic: "Should Q Street be closed to traffic during the farmers market?",
      phase: "lobby", // Start in lobby so host can test the compilation
      subPhase: undefined,
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
        text: "I've been selling at this farmers market for eight years and I can tell you that closing Q Street is absolutely essential for our community. When cars are constantly driving through, families with young children are terrified to browse the stalls. I've seen so many close calls with distracted drivers who don't realize there's a market happening. The foot traffic we get when the street is fully pedestrianized is incredible - people actually stop and talk to vendors instead of rushing past worried about traffic. My sales go up 40% on market days compared to when we tried keeping the street open. This isn't just about money though, it's about creating a space where neighbors can actually connect with each other. The farmers market is one of the few places left where you can have genuine conversations with people from your community. Kids can run around safely, elderly folks can take their time without worrying about getting hit by a car, and everyone can actually enjoy the experience. Yes, it causes some inconvenience for drivers, but surely we can prioritize community gathering spaces over car convenience for a few hours each week. The street closure creates the kind of vibrant public space that makes neighborhoods worth living in.",
        author: "FarmersMarketVendor",
        roomId: roomId,
        timestamp: Date.now() - 600000,
      },
      {
        id: generateId(),
        text: "This street closure is absolutely ridiculous and shows a complete disregard for the people who actually live on Q Street. I'm elderly and I depend on being able to park close to my apartment - I can't walk three blocks carrying groceries because some vendors want to make money in the street. Every Saturday I'm trapped in my own neighborhood because they block off the main access route. What about people who work weekends and need to get to their jobs? What about emergency vehicles trying to reach residents? I had a medical emergency last month and the ambulance was delayed because they couldn't navigate around the market setup. The city is prioritizing tourists and weekend visitors over the actual residents who live here and pay taxes here year-round. When I moved to this street fifteen years ago, I chose it specifically because of the convenient car access. Now I'm being punished for not being young and healthy enough to walk everywhere. The farmers market could easily happen in the park two blocks over, but instead they've decided to take over our street and make our lives miserable. This is gentrification pure and simple - pushing out longtime residents who don't fit the hip walkable neighborhood image. I'm on a fixed income and can't afford to move, but they're making it impossible for me to live here comfortably.",
        author: "QStreetResident",
        roomId: roomId,
        timestamp: Date.now() - 500000,
      },
      {
        id: generateId(),
        text: "I'm really torn on this issue because I see valid points on both sides. As someone who's been organizing community events for years, I absolutely love what the farmers market brings to our neighborhood - it's created connections between people who might never have met otherwise. But I also hear the very real concerns from residents, especially elderly folks and people with disabilities who genuinely need car access. Maybe the solution isn't all or nothing? What if we closed just half the street and created dedicated loading zones for residents who need them? Or what if we invested in better shuttle services or mobile vendor carts that could reach people who can't make it to the main market area? I've seen other cities create brilliant compromises that serve everyone. The farmers market vendors deserve a safe, thriving space to sell their goods and connect with customers. But our longtime residents also deserve to feel comfortable and welcome in their own neighborhood. We need to get creative instead of just fighting about it. Could we try different layouts, different times, or different support services? I refuse to believe that supporting local agriculture has to come at the expense of accessibility for residents. Both goals are important and both communities deserve our respect and consideration.",
        author: "CommunityAdvocate",
        roomId: roomId,
        timestamp: Date.now() - 400000,
      },
      {
        id: generateId(),
        text: "From a business perspective, this street closure is a double-edged sword that's killing me slowly. On one hand, the farmers market brings foot traffic that benefits my restaurant - people grab coffee from us before browsing the stalls, and some market shoppers become regular customers. But on the other hand, the setup and breakdown process is a nightmare for deliveries and staff scheduling. My bread delivery has to come at 5 AM now instead of the normal 8 AM slot, which costs me extra money. Customers who want to grab takeout on Saturday mornings can't find parking and just go somewhere else. My weekend lunch crowd has definitely decreased because people avoid the area entirely rather than deal with the traffic diversions. The market organizers promised that local businesses would benefit, but they didn't think through the operational challenges. I'm not anti-farmers market, but the current system feels like it was designed by people who don't actually run businesses in the area. What about reserved parking for local business customers? What about better signage directing people to alternative routes? What about coordinating delivery schedules with all the affected businesses? Right now it feels like the market just drops in one day a week and expects everyone else to figure it out. I want to support local vendors and I want foot traffic, but I also need to be able to operate my business efficiently.",
        author: "LocalBusiness",
        roomId: roomId,
        timestamp: Date.now() - 300000,
      },
      {
        id: generateId(),
        text: "Looking at this from an urban planning perspective, the Q Street farmers market represents exactly the kind of public space activation we need more of in our cities. Streets are public infrastructure that should serve multiple purposes beyond just moving cars efficiently. When we prioritize cars above all else, we create dead zones where community life can't flourish. The farmers market transforms Q Street from a traffic corridor into a genuine public square where social capital gets built. This is how we create the kind of walkable, livable neighborhoods that actually improve public health, reduce isolation, and strengthen local economies. Yes, there are legitimate accessibility concerns that need to be addressed, but the solution is better public transit, better pedestrian infrastructure, and more creative accommodation for people with mobility needs - not surrendering our public space back to cars. Cities all over the world are reclaiming street space for markets, festivals, and community gatherings because they've learned that car-centric design makes neighborhoods less safe, less healthy, and less economically vibrant. The short-term inconvenience of traffic diversions is worth the long-term benefits of having a neighborhood where people actually know each other and support local businesses. We should be expanding this model, not retreating from it. What if we had multiple car-free community spaces throughout the week? What if we redesigned our streets to be truly multimodal instead of car-dominant?",
        author: "UrbanPlanner",
        roomId: roomId,
        timestamp: Date.now() - 200000,
      },
    ];

    // Save all rants
    for (const rant of rants) {
      await saveRant(rant);
    }

    // Update user's current room
    user.currentRoomId = roomId;
    await saveUserSession(user);

    return c.json({
      room: debateRoom,
      players: fakeUsers.length + 1, // +1 for the creating user
      rants: rants.length,
      message: "Rant test room created successfully! 5 players have already submitted detailed rants ready for AI compilation.",
    });
  } catch (error) {
    console.error("Error creating rant test room:", error);
    return c.json({ error: "Failed to create rant test room" }, 500);
  }
});

export { app as debateApi };