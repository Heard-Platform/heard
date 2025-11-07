// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import {
  hashPassword,
  verifyPassword,
  generateResetToken,
} from "./password-utils.tsx";

const app = new Hono();

// Utility function to get frontend URL
const getFrontendUrl = (): string => {
  return (
    Deno.env.get("FRONTEND_URL") || "https://app.heard-now.com"
  );
};

// Generate ID for new users
const generateId = () => {
  return crypto.randomUUID();
};

// Types
interface UserSession {
  id: string;
  nickname: string;
  email: string;
  score: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
  isTestUser?: boolean;
  isDeveloper?: boolean;
  passwordHash?: string;
}

// Utility functions
export const getUserSession = async (
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

// Email sending utility
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

// Welcome email
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

// Password reset email
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

// Sign up new user with password
app.post("/make-server-f1a393b4/auth/signup", async (c: any) => {
  try {
    const { nickname, email, password } = await c.req.json();

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

    if (!password || password.length < 6) {
      return c.json(
        { error: "Password must be at least 6 characters" },
        400,
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists with this email
    const existingUser = await getUserByEmail(normalizedEmail);

    if (existingUser) {
      return c.json(
        { error: "An account with this email already exists" },
        409,
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create new user
    console.log(
      `Creating new user with password for email ${normalizedEmail}`,
    );
    const userId = generateId();
    const userSession: UserSession = {
      id: userId,
      nickname: nickname.substring(0, 20),
      email: normalizedEmail,
      score: 0,
      streak: 0,
      lastActive: Date.now(),
      isTestUser: false,
      isDeveloper: false,
      passwordHash,
    };

    await saveUserSession(userSession);

    // Send welcome email (don't block user creation if email fails)
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

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } =
      userSession;

    return c.json({
      user: userWithoutPassword,
      isReturningUser: false,
    });
  } catch (error) {
    console.error("Error signing up user:", error);
    return c.json({ error: "Failed to create account" }, 500);
  }
});

// Sign in existing user
app.post("/make-server-f1a393b4/auth/signin", async (c: any) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(
        { error: "Email and password are required" },
        400,
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Get user by email
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return c.json(
        { error: "Invalid email or password" },
        401,
      );
    }

    // Check if user has a password hash
    if (!user.passwordHash) {
      return c.json(
        {
          error:
            "This account needs to set a password. Please use password reset.",
        },
        401,
      );
    }

    // Verify password
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

    // Update last active time
    user.lastActive = Date.now();
    await saveUserSession(user);

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return c.json({
      user: userWithoutPassword,
      isReturningUser: true,
    });
  } catch (error) {
    console.error("Error signing in user:", error);
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

// Request password reset
app.post(
  "/make-server-f1a393b4/auth/forgot-password",
  async (c: any) => {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Get user by email
      const user = await getUserByEmail(normalizedEmail);

      // Don't reveal if user exists or not (security best practice)
      if (!user) {
        return c.json({
          success: true,
          message:
            "If an account exists with this email, you will receive a password reset link.",
        });
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

      // Store reset token
      await kv.set(
        `password_reset:${resetToken}`,
        JSON.stringify({
          email: normalizedEmail,
          expiresAt,
        }),
      );

      // Send password reset email
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

// Reset password with token
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

      // Get reset token data
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

      // Check if token is expired
      if (Date.now() > resetData.expiresAt) {
        // Delete expired token
        await kv.del(`password_reset:${token}`);
        return c.json(
          {
            error:
              "Reset token has expired. Please request a new one.",
          },
          400,
        );
      }

      // Get user
      const user = await getUserByEmail(resetData.email);

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      user.passwordHash = passwordHash;
      await saveUserSession(user);

      // Delete used reset token
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

export { app as authApi };