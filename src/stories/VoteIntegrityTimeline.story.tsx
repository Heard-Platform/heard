import { VoteIntegrityTimeline, VoteChoice, VoteIntegrityEvent } from "../components/analysis/VoteIntegrityTimeline";
import { StoryContainer } from "./StoryContainer";

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15",
];

const STATEMENTS = [
  "The city council should hold town halls quarterly, not annually.",
  "Property tax increases should require a public referendum.",
  "The new transit line should prioritize low-income neighborhoods.",
  "Short-term rentals should be capped at 90 days per year.",
  "The city should fund a universal basic income pilot program.",
];

const CHOICES: VoteChoice[] = ["super_agree", "agree", "pass", "disagree"];

function makeFingerprint(rand: () => number): string {
  const ua = USER_AGENTS[Math.floor(rand() * USER_AGENTS.length)];
  const screen = `${1024 + Math.floor(rand() * 900)}x${768 + Math.floor(rand() * 500)}`;
  const tz = Math.floor(rand() * 24) - 12;
  return `${ua}|${screen}|tz${tz}|${Math.floor(rand() * 1e6)}`;
}

function buildTimeline(): VoteIntegrityEvent[] {
  const rand = seededRand(7);
  const now = Date.now();
  const windowStart = now - 2 * 60 * 60 * 1000; // 2-hour session
  const events: VoteIntegrityEvent[] = [];
  let idCounter = 0;
  const nextId = () => `v${String(++idCounter).padStart(4, "0")}`;

  // Organic activity: ~35 distinct voters, mix of anon and identified,
  // each casting a handful of votes spread naturally through the session.
  for (let voter = 0; voter < 35; voter++) {
    const fingerprint = makeFingerprint(rand);
    const isAnon = rand() < 0.4;
    const voteCount = 1 + Math.floor(rand() * 5);
    for (let i = 0; i < voteCount; i++) {
      events.push({
        id: nextId(),
        timestamp: windowStart + rand() * 2 * 60 * 60 * 1000,
        fingerprint,
        isAnon,
        choice: CHOICES[Math.floor(rand() * CHOICES.length)],
        statementText: STATEMENTS[Math.floor(rand() * STATEMENTS.length)],
      });
    }
  }

  // Fraud pattern #1: one anon fingerprint hammering "super_agree" on the
  // same statement, ~2.5s apart, for 40 seconds straight.
  const fraudFp1 = makeFingerprint(rand);
  const burstStart1 = windowStart + 55 * 60 * 1000;
  for (let i = 0; i < 15; i++) {
    events.push({
      id: nextId(),
      timestamp: burstStart1 + i * 2500,
      fingerprint: fraudFp1,
      isAnon: true,
      choice: "super_agree",
      statementText: STATEMENTS[1],
    });
  }

  // Fraud pattern #2: a second anon fingerprint spamming "disagree" on a
  // different statement later in the session, slightly slower cadence.
  const fraudFp2 = makeFingerprint(rand);
  const burstStart2 = windowStart + 100 * 60 * 1000;
  for (let i = 0; i < 8; i++) {
    events.push({
      id: nextId(),
      timestamp: burstStart2 + i * 3200,
      fingerprint: fraudFp2,
      isAnon: true,
      choice: "disagree",
      statementText: STATEMENTS[3],
    });
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

// A handful of very high-frequency voters, scattered (not bursty) across an
// hour -- stresses rendering density without looking like a burst pattern.
function buildDenseTimeline(): VoteIntegrityEvent[] {
  const rand = seededRand(23);
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const events: VoteIntegrityEvent[] = [];
  let idCounter = 0;
  const nextId = () => `d${String(++idCounter).padStart(4, "0")}`;

  for (let voter = 0; voter < 10; voter++) {
    const fingerprint = makeFingerprint(rand);
    const isAnon = rand() < 0.3;
    const voteCount = 100 + Math.floor(rand() * 60);
    for (let i = 0; i < voteCount; i++) {
      events.push({
        id: nextId(),
        timestamp: windowStart + rand() * 60 * 60 * 1000,
        fingerprint,
        isAnon,
        choice: CHOICES[Math.floor(rand() * CHOICES.length)],
        statementText: STATEMENTS[Math.floor(rand() * STATEMENTS.length)],
      });
    }
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

const mixedVotes = buildTimeline();
const denseVotes = buildDenseTimeline();
const cleanVotes = mixedVotes.filter((v) => {
  const fp = v.fingerprint;
  const isFraud = mixedVotes.filter((o) => o.fingerprint === fp).length >= 8;
  return !isFraud;
});

export function VoteIntegrityTimelineStory() {
  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <StoryContainer
        title="Vote Integrity Timeline"
        description="Panable/zoomable timeline of individual votes for spotting coordinated or bot-driven voting"
        variants={[
          {
            id: "mixed",
            label: "Session with fraud",
            children: <VoteIntegrityTimeline votes={mixedVotes} />,
          },
          {
            id: "clean",
            label: "Clean session",
            children: <VoteIntegrityTimeline votes={cleanVotes} />,
          },
          {
            id: "dense",
            label: "10 power voters",
            children: <VoteIntegrityTimeline votes={denseVotes} />,
          },
          {
            id: "empty",
            label: "Empty",
            children: <VoteIntegrityTimeline votes={[]} />,
          },
        ]}
      />
    </div>
  );
}
