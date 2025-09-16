import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

interface Statement {
  id: string;
  text: string;
  author: string;
  votes: number;
  type?: 'bridge' | 'crux' | 'plurality';
  isSpicy?: boolean;
  roomId: string;
  timestamp: number;
  voters: string[]; // Track who voted to prevent double voting
}

interface DebateRoom {
  id: string;
  topic: string;
  phase: 'lobby' | 'initial' | 'bridge' | 'crux' | 'plurality' | 'voting' | 'results';
  roundNumber: number;
  phaseStartTime: number;
  participants: string[];
  isActive: boolean;
  createdAt: number;
}

interface UserSession {
  id: string;
  nickname: string;
  score: number;
  bridgePoints: number;
  cruxPoints: number;
  pluralityPoints: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
}

const app = new Hono();

// Utility functions
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const getUserSession = async (userId: string): Promise<UserSession | null> => {
  const session = await kv.get(`user:${userId}`);
  return session ? JSON.parse(session) : null;
};

const saveUserSession = async (session: UserSession) => {
  await kv.set(`user:${session.id}`, JSON.stringify(session));
};

const getDebateRoom = async (roomId: string): Promise<DebateRoom | null> => {
  const room = await kv.get(`room:${roomId}`);
  return room ? JSON.parse(room) : null;
};

const saveDebateRoom = async (room: DebateRoom) => {
  await kv.set(`room:${room.id}`, JSON.stringify(room));
  // Also save to active rooms list if active
  if (room.isActive) {
    await kv.set(`active_room:${room.id}`, JSON.stringify(room));
  } else {
    await kv.del(`active_room:${room.id}`);
  }
};

const getStatements = async (roomId: string): Promise<Statement[]> => {
  const statements = await kv.getByPrefix(`statement:${roomId}:`);
  return statements.map(s => JSON.parse(s)).sort((a, b) => b.timestamp - a.timestamp);
};

const saveStatement = async (statement: Statement) => {
  await kv.set(`statement:${statement.roomId}:${statement.id}`, JSON.stringify(statement));
};

// Create or join user session
app.post('/make-server-f1a393b4/user/create', async (c) => {
  try {
    const { nickname } = await c.req.json();
    
    if (!nickname || nickname.length < 2 || nickname.length > 20) {
      return c.json({ error: 'Nickname must be 2-20 characters' }, 400);
    }

    const userId = generateId();
    const userSession: UserSession = {
      id: userId,
      nickname: nickname.substring(0, 20), // Ensure max length
      score: 0,
      bridgePoints: 0,
      cruxPoints: 0,
      pluralityPoints: 0,
      streak: 0,
      lastActive: Date.now()
    };

    await saveUserSession(userSession);
    return c.json({ user: userSession });
  } catch (error) {
    console.error('Error creating user session:', error);
    return c.json({ error: 'Failed to create user session' }, 500);
  }
});

// Get user session
app.get('/make-server-f1a393b4/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const user = await getUserSession(userId);
    
    if (!user) {
      return c.json({ error: 'User session not found' }, 404);
    }

    // Update last active
    user.lastActive = Date.now();
    await saveUserSession(user);

    return c.json({ user });
  } catch (error) {
    console.error('Error fetching user session:', error);
    return c.json({ error: 'Failed to fetch user session' }, 500);
  }
});

// Create debate room
app.post('/make-server-f1a393b4/room/create', async (c) => {
  try {
    const { topic, userId } = await c.req.json();
    
    if (!topic || topic.length < 10) {
      return c.json({ error: 'Topic must be at least 10 characters' }, 400);
    }

    const user = await getUserSession(userId);
    if (!user) {
      return c.json({ error: 'User session not found' }, 404);
    }

    const roomId = generateId();
    const debateRoom: DebateRoom = {
      id: roomId,
      topic: topic.substring(0, 500), // Limit topic length
      phase: 'lobby',
      roundNumber: 1,
      phaseStartTime: Date.now(),
      participants: [userId],
      isActive: true,
      createdAt: Date.now()
    };

    await saveDebateRoom(debateRoom);
    
    // Update user's current room
    user.currentRoomId = roomId;
    await saveUserSession(user);

    return c.json({ room: debateRoom });
  } catch (error) {
    console.error('Error creating debate room:', error);
    return c.json({ error: 'Failed to create debate room' }, 500);
  }
});

// Join debate room
app.post('/make-server-f1a393b4/room/:roomId/join', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    const { userId } = await c.req.json();

    const room = await getDebateRoom(roomId);
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    if (!room.isActive) {
      return c.json({ error: 'Room is no longer active' }, 400);
    }

    const user = await getUserSession(userId);
    if (!user) {
      return c.json({ error: 'User session not found' }, 404);
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
    console.error('Error joining debate room:', error);
    return c.json({ error: 'Failed to join debate room' }, 500);
  }
});

// Get room status
app.get('/make-server-f1a393b4/room/:roomId', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    const room = await getDebateRoom(roomId);
    
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    const statements = await getStatements(roomId);
    
    return c.json({ 
      room,
      statements,
      participantCount: room.participants.length
    });
  } catch (error) {
    console.error('Error fetching room status:', error);
    return c.json({ error: 'Failed to fetch room status' }, 500);
  }
});

// Submit statement
app.post('/make-server-f1a393b4/room/:roomId/statement', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    const { text, type, userId } = await c.req.json();

    if (!text || text.length < 5 || text.length > 500) {
      return c.json({ error: 'Statement must be 5-500 characters' }, 400);
    }

    const room = await getDebateRoom(roomId);
    if (!room || !room.isActive) {
      return c.json({ error: 'Room not found or inactive' }, 404);
    }

    const user = await getUserSession(userId);
    if (!user) {
      return c.json({ error: 'User session not found' }, 404);
    }

    if (!room.participants.includes(userId)) {
      return c.json({ error: 'User not in this room' }, 403);
    }

    const statement: Statement = {
      id: generateId(),
      text: text.trim(),
      author: user.nickname,
      votes: 0,
      type: type || undefined,
      isSpicy: text.includes('🌶️') || text.length > 200,
      roomId,
      timestamp: Date.now(),
      voters: []
    };

    await saveStatement(statement);

    // Award points to user
    const basePoints = 50;
    const spicyBonus = statement.isSpicy ? 25 : 0;
    const typeBonus = type ? 50 : 0;
    const totalPoints = basePoints + spicyBonus + typeBonus;

    user.score += totalPoints;
    user.streak += 1;
    
    if (type === 'bridge') user.bridgePoints += totalPoints;
    else if (type === 'crux') user.cruxPoints += totalPoints;
    else if (type === 'plurality') user.pluralityPoints += totalPoints;

    await saveUserSession(user);

    return c.json({ 
      statement, 
      pointsEarned: totalPoints,
      achievement: {
        title: type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Submitted!` : 'Statement Posted!',
        description: `+${totalPoints} points`,
        points: totalPoints,
        type: type || 'score'
      }
    });
  } catch (error) {
    console.error('Error submitting statement:', error);
    return c.json({ error: 'Failed to submit statement' }, 500);
  }
});

// Vote on statement
app.post('/make-server-f1a393b4/statement/:statementId/vote', async (c) => {
  try {
    const statementId = c.req.param('statementId');
    const { voteType, userId } = await c.req.json();

    if (!['up', 'down'].includes(voteType)) {
      return c.json({ error: 'Invalid vote type' }, 400);
    }

    const user = await getUserSession(userId);
    if (!user) {
      return c.json({ error: 'User session not found' }, 404);
    }

    // Find the statement (need to search by prefix since we don't know the room)
    const allStatements = await kv.getByPrefix('statement:');
    const statementData = allStatements.find(s => {
      const parsed = JSON.parse(s);
      return parsed.id === statementId;
    });

    if (!statementData) {
      return c.json({ error: 'Statement not found' }, 404);
    }

    const statement: Statement = JSON.parse(statementData);

    // Check if user already voted
    if (statement.voters.includes(userId)) {
      return c.json({ error: 'Already voted on this statement' }, 400);
    }

    // Update vote count and add voter
    statement.votes += voteType === 'up' ? 1 : -1;
    statement.voters.push(userId);

    await saveStatement(statement);

    // Award points for voting
    if (voteType === 'up') {
      user.score += 10;
      await saveUserSession(user);
    }

    return c.json({ 
      statement,
      pointsEarned: voteType === 'up' ? 10 : 0
    });
  } catch (error) {
    console.error('Error voting on statement:', error);
    return c.json({ error: 'Failed to vote on statement' }, 500);
  }
});

// Update room phase
app.post('/make-server-f1a393b4/room/:roomId/phase', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    const { phase, userId } = await c.req.json();

    const validPhases = ['lobby', 'initial', 'bridge', 'crux', 'plurality', 'voting', 'results'];
    if (!validPhases.includes(phase)) {
      return c.json({ error: 'Invalid phase' }, 400);
    }

    const room = await getDebateRoom(roomId);
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    const user = await getUserSession(userId);
    if (!user || !room.participants.includes(userId)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    room.phase = phase;
    room.phaseStartTime = Date.now();
    
    // If moving to results, increment round number
    if (phase === 'results') {
      room.roundNumber += 1;
    }

    await saveDebateRoom(room);

    return c.json({ room });
  } catch (error) {
    console.error('Error updating room phase:', error);
    return c.json({ error: 'Failed to update room phase' }, 500);
  }
});

// Get active rooms
app.get('/make-server-f1a393b4/rooms/active', async (c) => {
  try {
    const activeRooms = await kv.getByPrefix('active_room:');
    const rooms = activeRooms.map(r => JSON.parse(r));
    
    return c.json({ rooms });
  } catch (error) {
    console.error('Error fetching active rooms:', error);
    return c.json({ error: 'Failed to fetch active rooms' }, 500);
  }
});

export { app as debateApi };