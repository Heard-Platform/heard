import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { generateSparklineData } from "./stats-api.tsx";

Deno.test(
  "generateSparklineData - creates correct number of buckets",
  () => {
    const now = new Date("2024-12-10T12:00:00Z").getTime();
    const daysBack = 7;
    const result = generateSparklineData([], daysBack, now);
    assertEquals(result.length, 7);
  },
);

Deno.test(
  "generateSparklineData - correctly calculates bucket values",
  () => {
    const now = new Date(1765325954782).getTime();
    const daysBack = 7;
    const data = [{ createdAt: 1765313327658 }];

    const result = generateSparklineData(data, daysBack, now);
    assertEquals(result[6].count, 1);
  },
);