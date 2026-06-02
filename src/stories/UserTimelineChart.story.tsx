import { UserTimelineChart } from "../components/UserTimelineChart";
import type { UserTimelineEntry } from "../types";

const now = Date.now();
const DAY = 86_400_000;

// Seeded pseudo-random so values are stable across renders
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const adjectives = [
  "cosmic", "neon", "velvet", "solar", "quiet", "electric", "amber", "silver",
  "chrome", "crimson", "jade", "cobalt", "tidal", "lunar", "atomic", "vivid",
  "swift", "hollow", "bold", "wild", "mossy", "frozen", "bright", "dark",
];
const nouns = [
  "fox", "sage", "drift", "pulse", "wave", "bloom", "spark", "node", "orbit",
  "shift", "echo", "flame", "prism", "core", "lane", "loop", "glyph", "reef",
  "haze", "form", "vault", "ridge", "storm", "creek",
];

function generateUsers(count: number): UserTimelineEntry[] {
  const rand = seededRand(42);
  return Array.from({ length: count }, (_, i) => {
    const r = rand;
    const adj = adjectives[Math.floor(rand() * adjectives.length)];
    const noun = nouns[Math.floor(rand() * nouns.length)];
    const suffix = Math.floor(rand() * 99) + 1;
    const nickname = `${adj}_${noun}${suffix}`;

    const joinedDaysAgo = Math.floor(rand() * 540) + 1;
    // Cohort behaviour: ~40% churn quickly, ~35% moderate, ~25% long-term active
    const cohort = rand();
    let lastActiveDaysAgo: number;
    if (cohort < 0.4) {
      // churned: last active within a few days of joining
      lastActiveDaysAgo = Math.max(0, joinedDaysAgo - Math.floor(rand() * 5));
    } else if (cohort < 0.75) {
      // moderate: active for a while then dropped off
      const activeForDays = Math.floor(rand() * 60) + 5;
      lastActiveDaysAgo = Math.max(0, joinedDaysAgo - activeForDays);
    } else {
      // retained: still somewhat active
      lastActiveDaysAgo = Math.floor(rand() * 45);
    }

    const createdAt = now - joinedDaysAgo * DAY;
    const lastActive = now - lastActiveDaysAgo * DAY;
    const spanDays = Math.round((lastActive - createdAt) / DAY);

    // Scatter active days across the span; density scales with engagement
    const activeDayCount = Math.min(spanDays, Math.floor(rand() * spanDays * 0.4) + 1);
    const activeDays = Array.from({ length: activeDayCount }, () => {
      const offset = Math.floor(rand() * (spanDays + 1));
      const d = new Date(createdAt + offset * DAY);
      d.setUTCHours(0, 0, 0, 0);
      return d.getTime();
    }).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

    return {
      id: `u${String(i + 1).padStart(3, "0")}`,
      nickname,
      email: `${nickname}@example.com`,
      createdAt,
      lastActive,
      activeDays,
    } satisfies UserTimelineEntry;
  });
}

const mockUsers: UserTimelineEntry[] = [
  ...generateUsers(300),
  // test/dev users — should be excluded from the viz
  { id: "test01", nickname: "test_account", email: "test@test.com", createdAt: now - 90 * DAY, lastActive: now - DAY, isTestUser: true },
  { id: "dev01", nickname: "dev_user", email: "dev@dev.com", createdAt: now - 200 * DAY, lastActive: now, isDeveloper: true },
];

export function UserTimelineChartStory() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">User Activity Timeline</h2>
        <p className="text-slate-500 text-sm">
          Each bar spans from a user's first action (account creation) to their
          last recorded action. Test and developer accounts are excluded.
          Color reflects recency of last activity.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <UserTimelineChart users={mockUsers} />
      </div>
    </div>
  );
}

export function UserTimelineChartEmptyStory() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">User Activity Timeline — Empty</h2>
        <p className="text-slate-500 text-sm">Empty state when no users are passed.</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <UserTimelineChart users={[]} />
      </div>
    </div>
  );
}

export function UserTimelineChartOnlyTestUsersStory() {
  const testOnlyUsers = mockUsers.filter((u) => u.isTestUser || u.isDeveloper);
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">User Activity Timeline — Test Users Only</h2>
        <p className="text-slate-500 text-sm">
          All users are test/developer accounts, so they are filtered out — should show empty state.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <UserTimelineChart users={testOnlyUsers} />
      </div>
    </div>
  );
}
