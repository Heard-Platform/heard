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
}

interface UserSession {
  id: string;
  nickname: string;
  score: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
}

const app = new Hono();

// Utility functions
const generateId = () =>
  Math.random().toString(36).substring(2) +
  Date.now().toString(36);

const getUserSession = async (
  userId: string,
): Promise<UserSession | null> => {
  try {
    const session = await kv.get(`user:${userId}`);
    if (!session) return null;
    return JSON.parse(session);
  } catch (error) {
    console.error(`Error parsing user session for ${userId}:`, error);
    return null;
  }
};

const saveUserSession = async (session: UserSession) => {
  await kv.set(`user:${session.id}`, JSON.stringify(session));
};

const getDebateRoom = async (
  roomId: string,
): Promise<DebateRoom | null> => {
  try {
    const room = await kv.get(`room:${roomId}`);
    if (!room) return null;
    return JSON.parse(room);
  } catch (error) {
    console.error(`Error parsing room data for ${roomId}:`, error);
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

const deleteVote = async (statementId: string, userId: string) => {
  await kv.del(`vote:${statementId}:${userId}`);
};

const getVotesForStatement = async (statementId: string): Promise<Vote[]> => {
  try {
    const votes = await kv.getByPrefix(`vote:${statementId}:`);
    return votes
      .map((v) => {
        try {
          return JSON.parse(v);
        } catch (error) {
          console.error('Error parsing vote:', v, error);
          return null;
        }
      })
      .filter((v) => v !== null);
  } catch (error) {
    console.error(`Error fetching votes for statement ${statementId}:`, error);
    return [];
  }
};

const getVotesForStatements = async (statementIds: string[]): Promise<{ [statementId: string]: Vote[] }> => {
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
        console.error('Error parsing vote during bulk fetch:', voteData, error);
      }
    }
  } catch (error) {
    console.error('Error fetching bulk votes:', error);
  }
  
  return allVotes;
};

const calculateVoteStats = (votes: Vote[]): { agrees: number; disagrees: number; passes: number; voters: { [userId: string]: "agree" | "disagree" | "pass" } } => {
  const voters: { [userId: string]: "agree" | "disagree" | "pass" } = {};
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
          console.error('Error parsing statement:', s, error);
          return null;
        }
      })
      .filter((s) => s !== null);

    // Get all statement IDs
    const statementIds = parsedStatements.map(s => s.id);
    
    // Fetch votes for all statements at once
    const allVotes = await getVotesForStatements(statementIds);
    
    // Update each statement with calculated vote data
    const statementsWithVotes = parsedStatements.map(statement => {
      const votes = allVotes[statement.id] || [];
      const voteStats = calculateVoteStats(votes);
      
      return {
        ...statement,
        agrees: voteStats.agrees,
        disagrees: voteStats.disagrees,
        passes: voteStats.passes,
        voters: voteStats.voters,
      };
    });

    return statementsWithVotes.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error(`Error fetching statements for room ${roomId}:`, error);
    return [];
  }
};

const saveStatement = async (statement: Statement) => {
  await kv.set(
    `statement:${statement.roomId}:${statement.id}`,
    JSON.stringify(statement),
  );
};

// Create or join user session
app.post("/make-server-f1a393b4/user/create", async (c) => {
  try {
    const { nickname } = await c.req.json();

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

    const userId = generateId();
    const userSession: UserSession = {
      id: userId,
      nickname: nickname.substring(0, 20), // Ensure max length
      score: 0,
      streak: 0,
      lastActive: Date.now(),
    };

    await saveUserSession(userSession);
    return c.json({ user: userSession });
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
    const { topic, userId } = await c.req.json();

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
    console.log(`Found ${statements.length} statements for room ${roomId}`);

    return c.json({
      room,
      statements,
      participantCount: room.participants?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching room status:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return c.json(
      { 
        error: "Failed to fetch room status",
        details: error.message 
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
          case "round1": return 1;
          case "round2": return 2;
          case "round3": return 3;
          default: return 1; // Fallback to round 1
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
          console.error('Error parsing statement during vote search:', s, error);
          return false;
        }
      });

      if (!statementData) {
        return c.json({ error: "Statement not found" }, 404);
      }

      const statement: Statement = JSON.parse(statementData);
      console.log(`Voting on statement ${statementId} by user ${userId} with vote ${voteType}`);

      // Get current vote if it exists
      const currentVotes = await getVotesForStatement(statementId);
      const currentVote = currentVotes.find(v => v.userId === userId);
      let pointsEarned = 0;

      if (currentVote?.voteType === voteType) {
        // Same vote type - undo vote (delete the vote record)
        await deleteVote(statementId, userId);
        console.log(`Removed vote for user ${userId} on statement ${statementId}`);
        // No points change for undoing
      } else if (currentVote && currentVote.voteType !== voteType) {
        // Different vote type - update existing vote
        const updatedVote: Vote = {
          ...currentVote,
          voteType,
          timestamp: Date.now(),
        };
        await saveVote(updatedVote);
        console.log(`Updated vote for user ${userId} on statement ${statementId} to ${voteType}`);
        
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
        console.log(`Created new vote for user ${userId} on statement ${statementId}: ${voteType}`);
        
        if (voteType === "agree") {
          pointsEarned = 10; // Award points for agreeing
        }
      }

      // Get updated vote data to return
      const updatedVotes = await getVotesForStatement(statementId);
      const voteStats = calculateVoteStats(updatedVotes);
      
      // Update statement with calculated vote data (but don't save it - votes are separate)
      const updatedStatement = {
        ...statement,
        agrees: voteStats.agrees,
        disagrees: voteStats.disagrees,
        passes: voteStats.passes,
        voters: voteStats.voters,
      };

      console.log(`Final vote count for statement ${statementId}: ${voteStats.agrees} agree, ${voteStats.disagrees} disagree, ${voteStats.passes} pass (${updatedVotes.length} total votes)`);

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
      console.log(`Phase update request: roomId=${roomId}, phase=${phase}, subPhase=${subPhase}, userId=${userId}`);

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
        console.log(`Invalid phase received: ${phase}. Valid phases:`, validPhases);
        return c.json({ error: `Invalid phase: ${phase}. Valid phases: ${validPhases.join(", ")}` }, 400);
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
        return c.json({ error: "Only the room host can control the debate phases" }, 403);
      }

      room.phase = phase as Phase;
      room.subPhase = subPhase;
      room.roundStartTime = Date.now();

      // If moving to results, increment game number
      if (phase === "results") {
        room.gameNumber += 1;
      }

      await saveDebateRoom(room);

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
          console.error('Error parsing active room:', r, error);
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
        score: 450,
        streak: 3,
        currentRoomId: roomId,
        lastActive: Date.now(),
      },
      {
        id: "test_user_2",
        nickname: "RushHourWarrior",
        score: 380,
        streak: 5,
        currentRoomId: roomId,
        lastActive: Date.now(),
      },
      {
        id: "test_user_3",
        nickname: "EscalatorEtiquette",
        score: 520,
        streak: 2,
        currentRoomId: roomId,
        lastActive: Date.now(),
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
          { userId: "test_user_1", voteType: "disagree" as const },
          { userId: "test_user_3", voteType: "disagree" as const },
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
          { userId: "test_user_3", voteType: "disagree" as const },
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
          timestamp: statement.timestamp + Math.random() * 10000, // Slightly randomize vote times
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

export { app as debateApi };