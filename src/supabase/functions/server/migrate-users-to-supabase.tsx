import { saveUserAndEmail } from "./auth-api.tsx";
import type { User } from "./types.tsx";
import { createClientFromEnv } from "./db-utils.ts";
import { getAllRealUsers } from "./kv-utils.tsx";

const supabase = createClientFromEnv();

interface MigrationStats {
  total: number;
  alreadyMigrated: number;
  anonymousMigrated: number;
  fullAccountMigrated: number;
  skipped: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}

async function migrateAnonymousUser(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: anonData, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      return { success: false, error: error.message };
    } else if (!anonData || !anonData.user) {
      return { success: false, error: "No anonymous user data returned" };
    }
    
    user.supabaseAuthId = anonData.user.id;
    user.migratedToSupabaseAt = Date.now();
    await saveUserAndEmail(user);
    
    console.log(`  ✓ Anonymous user ${user.id} → Supabase ${anonData.user.id}`);
    return { success: true };
    
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function migrateFullAccountUser(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      user_metadata: {
        nickname: user.nickname,
        migrated_from_old_system: true,
        original_user_id: user.id,
        migrated_at: Date.now()
      }
    });
    
    if (createError) {
      if (createError.message?.includes("already registered")) {
        console.log(`  ⚠ Email ${user.email} already has Supabase account, linking...`);
        
        const { data: { users }, error: lookupError } = await supabase.auth.admin.listUsers();
        if (lookupError) {
          return { success: false, error: lookupError.message };
        }
        
        const existingUser = users.find(u => u.email === user.email);
        if (!existingUser) {
          return { success: false, error: "Could not find existing Supabase user" };
        }
        
        user.supabaseAuthId = existingUser.id;
        user.migratedToSupabaseAt = Date.now();
        await saveUserAndEmail(user);
        
        console.log(`  ✓ Linked existing account ${user.email} → ${existingUser.id}`);
        return { success: true };
      }
      
      return { success: false, error: createError.message };
    }
    
    user.supabaseAuthId = authData.user.id;
    user.migratedToSupabaseAt = Date.now();
    await saveUserAndEmail(user);
    
    console.log(`  ✓ Full account ${user.email} → Supabase ${authData.user.id}`);
    return { success: true };
    
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function migrateAllUsersToSupabase(dryRun: boolean = false): Promise<MigrationStats> {
  console.log("\n========================================");
  console.log("STARTING USER MIGRATION TO SUPABASE AUTH");
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE MIGRATION"}`);
  console.log("========================================\n");
  
  const stats: MigrationStats = {
    total: 0,
    alreadyMigrated: 0,
    anonymousMigrated: 0,
    fullAccountMigrated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };
  
  const users = await getAllRealUsers();
  stats.total = users.length;
  
  console.log(`Found ${users.length} users to process\n`);
  
  for (const user of users) {
    console.log(`Processing user ${user.id} (${user.email})...`);
    
    if (user.supabaseAuthId) {
      console.log(`  ⊘ Already migrated (Supabase ID: ${user.supabaseAuthId})`);
      stats.alreadyMigrated++;
      continue;
    }
    
    if (dryRun) {
      if (user.isAnonymous) {
        console.log(`  [DRY RUN] Would migrate anonymous user`);
        stats.anonymousMigrated++;
      } else {
        console.log(`  [DRY RUN] Would migrate full account: ${user.email}`);
        stats.fullAccountMigrated++;
      }
      continue;
    }

    if (user.isAnonymous) {
      const result = await migrateAnonymousUser(user);
      if (result.success) {
        stats.anonymousMigrated++;
      } else {
        stats.failed++;
        stats.errors.push({ userId: user.id, error: result.error || "Unknown error" });
        console.error(`  ✗ Failed: ${result.error}`);
      }
    } else {
      if (!user.email) {
        console.log(`  ⚠ Skipping user without email`);
        stats.skipped++;
        continue;
      }
      
      const result = await migrateFullAccountUser(user);
      if (result.success) {
        stats.fullAccountMigrated++;
      } else {
        stats.failed++;
        stats.errors.push({ userId: user.id, error: result.error || "Unknown error" });
        console.error(`  ✗ Failed: ${result.error}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n========================================");
  console.log("MIGRATION COMPLETE");
  console.log("========================================");
  console.log(`Total users: ${stats.total}`);
  console.log(`Already migrated: ${stats.alreadyMigrated}`);
  console.log(`Anonymous migrated: ${stats.anonymousMigrated}`);
  console.log(`Full accounts migrated: ${stats.fullAccountMigrated}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
  
  if (stats.errors.length > 0) {
    console.log("\nErrors:");
    stats.errors.forEach(({ userId, error }) => {
      console.log(`  - ${userId}: ${error}`);
    });
  }
  
  console.log("========================================\n");
  
  return stats;
}
