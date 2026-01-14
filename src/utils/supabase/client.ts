import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const getSupabaseSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting Supabase session:", error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error("Error getting Supabase session:", error);
    return null;
  }
};

export const refreshSupabaseSession = async (userId: string) => {
  try {
    console.log(`[Supabase Auth] Attempting to refresh session for user ${userId}`);
    
    const existingSession = await getSupabaseSession();
    
    if (existingSession) {
      console.log(`[Supabase Auth] Active session found for user ${userId}`, {
        userId: existingSession.user.id,
        expiresAt: existingSession.expires_at,
      });
      return existingSession;
    }
    
    console.log(`[Supabase Auth] No active session found for user ${userId}`);
    return null;
  } catch (error) {
    console.error(`[Supabase Auth] Error refreshing session for user ${userId}:`, error);
    return null;
  }
};
