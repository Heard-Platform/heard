import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { Statement, UserSession } from "./types.tsx";
import { parseKvDataArray } from "./kv-utils.tsx";

export const TABLE_NAME = "kv_store_f1a393b4";

export const client = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") as string,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string,
  );

export const getStatementsForUser = async (
  userId: string,
): Promise<Statement[]> => {
  const supabase = client();
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
  const supabase = client();
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

export const getAllRealUsers = async (): Promise<UserSession[]> => {
  const allUsers = await getAllRecords<UserSession>("user:");
  return allUsers.filter(user => !user.isTestUser);
};