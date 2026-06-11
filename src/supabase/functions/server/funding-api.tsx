// @ts-ignore
import { Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { API_URL_PREFIX } from "./constants.tsx";
import { createClientFromEnv } from "./db-utils.ts";

export const fundingApi = new Hono();

fundingApi.get(
  `${API_URL_PREFIX}/funding-stats`,
  defineRoute(
    {},
    async () => {
      const supabase = createClientFromEnv();
      const { data, error, count } = await supabase
        .from("donations")
        .select("amount", { count: "exact" });

      if (error) throw new Error(error.message);

      const totalDollars = (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0);
      return { totalDollars, donorCount: count ?? 0 };
    },
  ),
);
