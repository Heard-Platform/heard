import { wait } from "../utils/time";
import { mockUser } from "./mockData";

export const STORY_VALID_CODE = "ABC123";
export const STORY_REQUEST_DELAY_MS = 800;

interface EmailOtpStoryOptions {
  isExistingEmail?: boolean;
  isSignedIn?: boolean;
}

export function buildEmailOtpOverrides({
  isExistingEmail = false,
  isSignedIn = false,
}: EmailOtpStoryOptions) {
  return {
    user: { ...mockUser, isAnonymous: !isSignedIn },
    anonAddEmailAndLogin: async (email: string) => {
      console.log("[Story] anonAddEmailAndLogin", { email });
      await wait(STORY_REQUEST_DELAY_MS);
      if (isExistingEmail) {
        return {
          success: true,
          data: { requiresOtp: true as const, email },
        };
      }
      return {
        success: true,
        data: { requiresOtp: false as const, user: mockUser },
      };
    },
    verifyMagicLink: async (code: string) => {
      console.log("[Story] verifyMagicLink", { code });
      await wait(STORY_REQUEST_DELAY_MS);
      if (code !== STORY_VALID_CODE) {
        return {
          success: false,
          error: "Invalid code. Please try again.",
        };
      }
      return {
        success: true,
        data: { user: mockUser, sessionId: "story-session" },
      };
    },
  };
}
