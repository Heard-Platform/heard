import * as kv from "./kv_store.tsx";
import {
  hashPassword,
  verifyPassword,
  generateResetToken,
} from "./password-utils.tsx";
import { deleteMagicLink, getMagicLink, getParsedKvData, getSession, getUser, saveMagicLink, saveSession } from "./kv-utils.tsx";
import { getFrontendUrl } from "./utils.tsx";
import type { Session, User } from "./types.tsx";
import { Context, Hono } from "npm:hono";
import { getMagicLinkEmail } from "./email-templates.tsx";
import { mergeAnonymousUserActivity } from "./anonymous-merge-utils.tsx";
import { ENABLE_ANONYMOUS_MERGE } from "./constants.tsx";

const app = new Hono();

const generateId = () => {
  return crypto.randomUUID();
};

const generateMagicLinkCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const createSession = async (userId: string): Promise<Session> => {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const session: Session = {
    id,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
  
  await saveSession(session);
  return session;
};

export const validateSessionId = async (sessionId: string): Promise<{ valid: boolean; userId?: string; error?: string }> => {
  try {
    const session = await getSession(sessionId);

    if (!session) {
      return { valid: false, error: "Session not found" };
    }
    
    if (Date.now() > session.expiresAt) {
      return { valid: false, error: "Session expired" };
    }
    
    return { valid: true, userId: session.userId };
  } catch (error) {
    console.error("Error validating session ID:", error);
    return { valid: false, error: "Invalid session" };
  }
};

const getUserAndNewSession = async (userId: string) => {
  const user = await getUser(userId);

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  user.lastActive = Date.now();
  await saveUserAndEmail(user);

  const session = await createSession(user.id);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, sessionId: session.id };
};

const updateUserLastActive = async (userId: string) => {
  const user = await getUser(userId);

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  user.lastActive = Date.now();
  await saveUserAndEmail(user);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
};

export const getUserSession = async (
  userId: string,
): Promise<User | null> => {
  try {
    const user = await getParsedKvData<User>(
      `user:${userId}`,
    );
    if (!user) return null;

    if (user.isTestUser === undefined) {
      user.isTestUser = false;
    }

    return user;
  } catch (error) {
    console.error(
      `Error parsing user session for ${userId}:`,
      error,
    );
    return null;
  }
};

export const saveUserAndEmail = async (user: User) => {
  await kv.set(`user:${user.id}`, JSON.stringify(user));
  await kv.set(`user_email:${user.email}`, user.id);
};

const getUserByEmail = async (
  email: string,
): Promise<User | null> => {
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

const validateAccountCredentials = (
  nickname: string,
  email: string,
  password: string,
): { error: string; status: number } | null => {
  if (!nickname || nickname.length < 2 || nickname.length > 20) {
    return {
      error: "Nickname must be 2-20 characters",
      status: 400,
    };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      error: "Valid email address is required",
      status: 400,
    };
  }

  if (!password || password.length < 6) {
    return {
      error: "Password must be at least 6 characters",
      status: 400,
    };
  }

  return null;
};

const processAccountSetup = async (
  nickname: string,
  email: string,
  password: string,
  existingUserId?: string,
): Promise<{ user: Omit<User, "passwordHash">; error?: never, status?: never } | { error: string; status: number; user?: never }> => {
  const normalizedEmail = email.trim().toLowerCase();
  
  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser && existingUser.id !== existingUserId) {
    return {
      error: "An account with this email already exists",
      status: 409,
    };
  }

  const passwordHash = await hashPassword(password);

  let userSession: User;
  
  if (existingUserId) {
    const user = await getUserSession(existingUserId);
    if (!user) {
      return { error: "User not found", status: 404 };
    }
    if (!user.isAnonymous) {
      return { error: "User is already a full account", status: 400 };
    }
    
    user.nickname = nickname.substring(0, 20);
    user.email = normalizedEmail;
    user.passwordHash = passwordHash;
    user.isAnonymous = false;
    user.convertedFromAnonAt = Date.now();
    user.lastActive = Date.now();
    await saveUserAndEmail(user);
    userSession = user;
  } else {
    console.log(`Creating new user with password for email ${normalizedEmail}`);
    userSession = await createUserAccount(nickname, normalizedEmail, passwordHash);
  }

  sendWelcomeEmail(userSession.email, userSession.nickname).catch((error) => {
    console.error("Welcome email failed:", error);
  });

  const { passwordHash: _, ...userWithoutPassword } = userSession;
  return { user: userWithoutPassword };
};

export const createUserAccount = async (
  nickname: string,
  email: string,
  passwordHash: string,
  isAnonymous: boolean = false,
): Promise<User> => {
  const userId = generateId();
  const user: User = {
    id: userId,
    nickname: nickname.substring(0, 20),
    email: email.trim().toLowerCase(),
    score: 0,
    streak: 0,
    lastActive: Date.now(),
    isTestUser: false,
    isDeveloper: false,
    emailDigestsEnabled: !isAnonymous,
    passwordHash,
    createdAt: Date.now(),
    isAnonymous,
  };

  await saveUserAndEmail(user);
  return user;
};

export const createAnonymousUser = async (): Promise<User> => {
  const anonymousNickname = "Anonymous User";
  const anonymousEmail = `anon-${generateId()}@heard.anonymous`;

  const randomPassword = generateId();
  const passwordHash = await hashPassword(randomPassword);

  const user = await createUserAccount(
    anonymousNickname,
    anonymousEmail,
    passwordHash,
    true,
  );

  return user;
};

const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> => {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error(
        "RESEND_API_KEY environment variable not set",
      );
      return false;
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "HEARD <notifications@heard-now.com>",
          to: [to],
          subject,
          html,
          text: text || undefined,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Email API error (${response.status}):`,
        errorText,
      );
      return false;
    }

    const result = await response.json();
    console.log(`Email sent successfully to ${to}:`, result.id);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendWelcomeEmail = async (
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

const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
) => {
  const appUrl = getFrontendUrl();

  const resetHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8B5CF6; margin-bottom: 10px;">Reset Your Password</h1>
        <p style="color: #666; font-size: 16px;">You requested to reset your HEARD password</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
        <p style="margin: 0 0 15px 0; color: #333;">Click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${appUrl}/?resetToken=${resetToken}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">Or copy this code and enter it manually: <strong style="color: #8B5CF6;">${resetToken}</strong></p>
      </div>
      
      <div style="padding: 20px; background: #fff3cd; border-radius: 10px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>Didn't request this?</strong> You can safely ignore this email. Your password won't change unless you use the link above.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: "Reset Your HEARD Password 🔒",
    html: resetHtml,
  });
};

app.post(
  "/make-server-f1a393b4/auth/signup",
  async (c: any) => {
    try {
      const { nickname, email, password } = await c.req.json();

      const validationError = validateAccountCredentials(nickname, email, password);
      if (validationError) {
        return c.json({ error: validationError.error }, validationError.status);
      }

      const setupResult = await processAccountSetup(nickname, email, password);
      if ("error" in setupResult) {
        return c.json({ error: setupResult.error }, setupResult.status);
      }

      const userResult = await getUserAndNewSession(setupResult.user.id);
      if ("error" in userResult) {
        return c.json({ error: userResult.error }, userResult.status);
      }

      return c.json({
        user: userResult.user,
        sessionId: userResult.sessionId,
        isReturningUser: false,
      });
    } catch (error) {
      console.error("Error signing up user:", error);
      return c.json({ error: "Failed to create account" }, 500);
    }
  },
);

app.post(
  "/make-server-f1a393b4/auth/signin",
  async (c: any) => {
    try {
      const { email, password } = await c.req.json();

      if (!email || !password) {
        return c.json(
          { error: "Email and password are required" },
          400,
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      const user = await getUserByEmail(normalizedEmail);

      if (!user) {
        return c.json(
          { error: "Invalid email or password" },
          401,
        );
      }

      if (!user.passwordHash) {
        return c.json(
          {
            error:
              "This account needs to set a password. Please use password reset.",
          },
          401,
        );
      }

      const isValid = await verifyPassword(
        password,
        user.passwordHash,
      );

      if (!isValid) {
        return c.json(
          { error: "Invalid email or password" },
          401,
        );
      }

      const result = await getUserAndNewSession(user.id);
      if ("error" in result) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json({
        ...result,
        isReturningUser: true,
      });
    } catch (error) {
      console.error("Error signing in user:", error);
      return c.json({ error: "Failed to sign in" }, 500);
    }
  },
);

app.post(
  "/make-server-f1a393b4/auth/setup-anon",
  async (c: any) => {
    try {
      const { userId, nickname, email, password } = await c.req.json();

      if (!userId) {
        return c.json(
          { error: "User ID is required" },
          400,
        );
      }

      const validationError = validateAccountCredentials(nickname, email, password);
      if (validationError) {
        return c.json({ error: validationError.error }, validationError.status);
      }

      const result = await processAccountSetup(nickname, email, password, userId);
      if ("error" in result) {
        return c.json({ error: result.error }, result.status);
      }

      const userResult = await getUserAndNewSession(result.user.id);
      if ("error" in userResult) {
        return c.json({ error: userResult.error }, userResult.status);
      }

      return c.json({
        user: userResult.user,
        sessionId: userResult.sessionId,
      });
    } catch (error) {
      console.error("Error setting up anonymous user account:", error);
      return c.json({ error: "Failed to setup account" }, 500);
    }
  },
);

app.post(
  "/make-server-f1a393b4/auth/forgot-password",
  async (c: any) => {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }

      const normalizedEmail = email.trim().toLowerCase();

      const user = await getUserByEmail(normalizedEmail);

      if (!user) {
        return c.json({
          success: true,
          message:
            "If an account exists with this email, you will receive a password reset link.",
        });
      }

      const resetToken = generateResetToken();
      const expiresAt = Date.now() + 60 * 60 * 1000;

      await kv.set(
        `password_reset:${resetToken}`,
        JSON.stringify({
          email: normalizedEmail,
          expiresAt,
        }),
      );

      await sendPasswordResetEmail(normalizedEmail, resetToken);

      return c.json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      return c.json(
        { error: "Failed to process password reset request" },
        500,
      );
    }
  },
);

app.post(
  "/make-server-f1a393b4/auth/reset-password",
  async (c: any) => {
    try {
      const { token, newPassword } = await c.req.json();

      if (!token || !newPassword) {
        return c.json(
          { error: "Token and new password are required" },
          400,
        );
      }

      if (newPassword.length < 6) {
        return c.json(
          { error: "Password must be at least 6 characters" },
          400,
        );
      }

      const resetDataJson = await kv.get(
        `password_reset:${token}`,
      );

      if (!resetDataJson) {
        return c.json(
          { error: "Invalid or expired reset token" },
          400,
        );
      }

      const resetData = JSON.parse(resetDataJson);

      if (Date.now() > resetData.expiresAt) {
        await kv.del(`password_reset:${token}`);
        return c.json(
          {
            error:
              "Reset token has expired. Please request a new one.",
          },
          400,
        );
      }

      const user = await getUserByEmail(resetData.email);

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      const passwordHash = await hashPassword(newPassword);

      user.passwordHash = passwordHash;
      await saveUserAndEmail(user);

      await kv.del(`password_reset:${token}`);

      console.log(
        `Password reset successful for user: ${user.email}`,
      );

      return c.json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      return c.json({ error: "Failed to reset password" }, 500);
    }
  },
);

app.post(
  "/make-server-f1a393b4/user/anonymous",
  async (c: any) => {
    try {
      const user = await createAnonymousUser();

      const userResult = await getUserAndNewSession(user.id);
      if ("error" in userResult) {
        return c.json({ error: userResult.error }, userResult.status);
      }

      return c.json({
        user: userResult.user,
        sessionId: userResult.sessionId,
      });
    } catch (error) {
      console.error("Error creating anonymous user:", error);
      return c.json({ error: "Failed to create anonymous user" }, 500);
    }
  },
);

app.post(
  "/make-server-f1a393b4/auth/send-magic-link",
  async (c: any) => {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }

      const normalizedEmail = email.trim().toLowerCase();

      const user = await getUserByEmail(normalizedEmail);

      if (!user) {
        return c.json(
          { error: "No account found with this email" },
          404,
        );
      }

      const token = generateMagicLinkCode();
      const expiresAt = Date.now() + 15 * 60 * 1000;

      await saveMagicLink(token, {
        userId: user.id,
        email: normalizedEmail,
        expiresAt,
      });

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured" }, 500);
      }

      const magicLinkUrl = `https://heard-now.com/magic-link?token=${token}`;

      const html = getMagicLinkEmail(magicLinkUrl, token);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Heard <noreply@heard-now.com>",
          to: [normalizedEmail],
          subject: "Log in to Heard",
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send magic link email:", errorText);
        return c.json({ error: "Failed to send email" }, 500);
      }

      console.log(`Magic link sent to ${normalizedEmail}`);

      return c.json({ success: true });
    } catch (error) {
      console.error("Error sending magic link:", error);
      return c.json({ error: "Failed to send magic link" }, 500);
    }
  },
);

app.post(
  "/make-server-f1a393b4/auth/send-magic-link-auto",
  async (c: any) => {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }

      const normalizedEmail = email.trim().toLowerCase();

      let user = await getUserByEmail(normalizedEmail);

      if (!user) {
        console.log(`No account found for ${normalizedEmail}, creating new account`);
        
        const emailPrefix = normalizedEmail.split('@')[0];
        const randomSuffix = Math.floor(Math.random() * 10000);
        const generatedNickname = `${emailPrefix}${randomSuffix}`;
        
        const randomPassword = generateId();
        const passwordHash = await hashPassword(randomPassword);
        
        user = await createUserAccount(
          generatedNickname,
          normalizedEmail,
          passwordHash,
          false,
        );
        
        console.log(`Created new account for ${normalizedEmail} with nickname ${generatedNickname}`);
      }

      const token = generateMagicLinkCode();
      const expiresAt = Date.now() + 15 * 60 * 1000;

      await saveMagicLink(token, {
        userId: user.id,
        email: normalizedEmail,
        expiresAt,
      });

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured" }, 500);
      }

      const magicLinkUrl = `https://heard-now.com/magic-link?token=${token}`;

      const html = getMagicLinkEmail(magicLinkUrl, token);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Heard <noreply@heard-now.com>",
          to: [normalizedEmail],
          subject: "Log in to Heard",
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send magic link email:", errorText);
        return c.json({ error: "Failed to send email" }, 500);
      }

      console.log(`Magic link sent to ${normalizedEmail}`);

      return c.json({ success: true });
    } catch (error) {
      console.error("Error sending magic link auto:", error);
      return c.json({ error: "Failed to send magic link" }, 500);
    }
  },
);

app.post(
  "/make-server-f1a393b4/auth/verify-magic-link",
  async (c: Context) => {
    type Params = {
      token: string;
      userId?: string;
    };

    try {
      const { token, userId: currentUserId } = await c.req.json<Params>();

      if (!token) {
        return c.json({ error: "Token is required" }, 400);
      }

      const magicLinkData = await getMagicLink(token);

      if (!magicLinkData) {
        return c.json({ error: "Invalid or expired magic link" }, 401);
      }

      const { userId, expiresAt } = magicLinkData;

      if (Date.now() > expiresAt) {
        await deleteMagicLink(token);
        return c.json({ error: "Magic link has expired" }, 401);
      }

      await deleteMagicLink(token);
      
      if (currentUserId) {
        const currentUser = await getUser(currentUserId);
        if (ENABLE_ANONYMOUS_MERGE && currentUser && currentUser.isAnonymous) {
          try {
            await mergeAnonymousUserActivity(currentUserId, userId);
          } catch (error) {
            console.error("Error during anonymous activity merge:", error);
          }
        }
      }

      const result = await getUserAndNewSession(userId);
      if ("error" in result) {
        return c.json({ error: result.error }, result.status as any);
      }

      return c.json(result);
    } catch (error) {
      console.error("Error verifying magic link:", error);
      return c.json({ error: "Failed to verify magic link" }, 500);
    }
  },
);

app.post(
  "/make-server-f1a393b4/auth/migrate-session",
  async (c: any) => {
    try {
      const { userId } = await c.req.json();

      if (!userId) {
        return c.json({ error: "User ID is required" }, 400);
      }

      const result = await getUserAndNewSession(userId);
      if ("error" in result) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result);
    } catch (error) {
      console.error("Error migrating session:", error);
      return c.json({ error: "Failed to migrate session" }, 500);
    }
  },
);

export { app as authApi };
export { updateUserLastActive };