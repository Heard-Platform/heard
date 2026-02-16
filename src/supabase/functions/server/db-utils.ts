import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2.49.8";
import { Statement } from "./types.tsx";
import { parseKvDataArray } from "./kv-utils.tsx";

export const TABLE_NAME = "kv_store_f1a393b4";

export const createClientFromEnv = (): SupabaseClient =>
  createClient(
    Deno.env.get("SUPABASE_URL") as string,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string,
  );

export const insert = async <T extends Record<string, any>>(
  tableName: string,
  data: T,
): Promise<{ success: boolean; error?: string }> => {
  const supabase = createClientFromEnv();
  
  const { error } = await supabase
    .from(tableName)
    .insert(data);

  if (error) {
    console.error(`Error inserting into ${tableName} table:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const upsert = async (
  tableName: string,
  data: Record<string, any>,
  onConflictField: string,
) => {
  const supabase = createClientFromEnv();

  const { error } = await supabase
    .from(tableName)
    .upsert(data, { onConflict: onConflictField });

  if (error) {
    console.error(`Error upserting ${tableName} table:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const selectAll = async <T>(
  tableName: string,
  conditions?: Record<string, any>,
  modifier?: (query: any) => any,
): Promise<T[]> => {
  const supabase = createClientFromEnv();

  let q = supabase
    .from(tableName)
    .select("*")
    .match(conditions || {});

  if (modifier) q = modifier(q);

  const { data, error } = await q;

  if (error) {
    console.error(`Error selecting from ${tableName} table:`, error);
    throw new Error(error.message);
  }

  return (data ?? []) as T[];
};

export const getStatementsForUser = async (
  userId: string,
): Promise<Statement[]> => {
  const supabase = createClientFromEnv();
  let userStatements: Statement[] = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("value")
      .like("key", "statement:%")
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }
    if (data && data.length > 0) {
      const statements = parseKvDataArray<Statement>(
        data.map((d) => d.value),
      );
      const batchUserStatements = statements.filter(
        (s) => s.author === userId,
      );
      userStatements = userStatements.concat(
        batchUserStatements,
      );
      offset += limit;
    } else {
      break;
    }
  }
  return userStatements;
};

export const getAllRecords = async <T>(
  prefix: string,
): Promise<T[]> => {
  const supabase = createClientFromEnv();
  const records: T[] = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("value")
      .like("key", `${prefix}%`)
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }
    if (data && data.length > 0) {
      const batchRecords = parseKvDataArray<T>(
        data.map((d) => d.value),
      );
      records.push(...batchRecords);
      offset += limit;
    } else {
      break;
    }
  }
  return records;
};