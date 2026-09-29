import { useState } from "react";
import { Button } from "../components/ui/button";
import { RoomAnalyticsModal } from "../components/room/RoomAnalyticsModal";
import type {
  AnonymityBreakdown,
  ParticipantJoin,
  ParticipationBreakdown,
  ReferrerShareCount,
  TrafficSourceCount,
} from "../components/room/RoomAnalyticsModal";
import {
  generateMockTrafficSources,
  generateMockReferrers,
  generateMockAnonymity,
  generateMockParticipation,
  generateMockJoins,
} from "../components/room/analytics-mock";
import { StoryContainer } from "./StoryContainer";

const mixedSources: TrafficSourceCount[] = generateMockTrafficSources("room-mixed", 214);
const mixedReferrers: ReferrerShareCount[] = generateMockReferrers(
  "room-mixed-referrers",
  mixedSources.find((s) => s.key === "referral")?.count ?? 0,
);
const mixedAnonymity: AnonymityBreakdown = generateMockAnonymity("room-mixed-anonymity", 214);
const mixedParticipation: ParticipationBreakdown = generateMockParticipation(
  "room-mixed-participation",
  360,
);
const mixedJoins: ParticipantJoin[] = generateMockJoins("room-mixed-joins", mixedAnonymity, 14);

const newsletterDominant: TrafficSourceCount[] = [
  { key: "newsletter", count: 312 },
  { key: "direct", count: 41 },
  { key: "referral", count: 18 },
  { key: "flyer", count: 6 },
  { key: "other", count: 2 },
];
const newsletterReferrers: ReferrerShareCount[] = generateMockReferrers(
  "newsletter-referrers",
  18,
);
const newsletterAnonymity: AnonymityBreakdown = generateMockAnonymity(
  "newsletter-anonymity",
  379,
);
const newsletterParticipation: ParticipationBreakdown = generateMockParticipation(
  "newsletter-participation",
  620,
);
const newsletterJoins: ParticipantJoin[] = generateMockJoins("newsletter-joins", newsletterAnonymity, 1);

const flyerCampaign: TrafficSourceCount[] = [
  { key: "flyer", count: 88 },
  { key: "referral", count: 22 },
  { key: "direct", count: 15 },
];
const flyerReferrers: ReferrerShareCount[] = generateMockReferrers("flyer-referrers", 22);
const flyerAnonymity: AnonymityBreakdown = generateMockAnonymity("flyer-anonymity", 125);
const flyerParticipation: ParticipationBreakdown = generateMockParticipation(
  "flyer-participation",
  210,
);
const flyerJoins: ParticipantJoin[] = generateMockJoins("flyer-joins", flyerAnonymity, 120);

const emptyState: TrafficSourceCount[] = [];

function ModalTrigger({
  label,
  roomTopic,
  trafficSources,
  referrers,
  anonymity,
  participation,
  joins,
}: {
  label: string;
  roomTopic: string;
  trafficSources: TrafficSourceCount[];
  referrers: ReferrerShareCount[];
  anonymity: AnonymityBreakdown;
  participation: ParticipationBreakdown;
  joins: ParticipantJoin[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex justify-center py-8">
      <Button onClick={() => setIsOpen(true)}>{label}</Button>
      {isOpen && (
        <RoomAnalyticsModal
          roomTopic={roomTopic}
          trafficSources={trafficSources}
          referrers={referrers}
          anonymity={anonymity}
          participation={participation}
          joins={joins}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export function RoomAnalyticsModalStory() {
  return (
    <StoryContainer
      title="Room Analytics (dev-only)"
      description="Dev-only room insights, starting with a traffic-source breakdown — newsletter, flyer, referral, direct link, etc. Social media shows as untracked until we build that. Friend referral expands into per-referrer share counts. More sections can be added here later."
      variants={[
        {
          id: "mixed",
          label: "Mixed sources",
          children: (
            <ModalTrigger
              label="Open modal"
              roomTopic="Should the city add more bike lanes downtown?"
              trafficSources={mixedSources}
              referrers={mixedReferrers}
              anonymity={mixedAnonymity}
              participation={mixedParticipation}
              joins={mixedJoins}
            />
          ),
        },
        {
          id: "newsletter",
          label: "Newsletter dominant",
          children: (
            <ModalTrigger
              label="Open modal"
              roomTopic="What should the new community center prioritize?"
              trafficSources={newsletterDominant}
              referrers={newsletterReferrers}
              anonymity={newsletterAnonymity}
              participation={newsletterParticipation}
              joins={newsletterJoins}
            />
          ),
        },
        {
          id: "flyer",
          label: "Flyer campaign",
          children: (
            <ModalTrigger
              label="Open modal"
              roomTopic="World Cup: who do you want to win?"
              trafficSources={flyerCampaign}
              referrers={flyerReferrers}
              anonymity={flyerAnonymity}
              participation={flyerParticipation}
              joins={flyerJoins}
            />
          ),
        },
        {
          id: "empty",
          label: "No data",
          children: (
            <ModalTrigger
              label="Open modal"
              roomTopic="Brand new room with no joins yet"
              trafficSources={emptyState}
              referrers={[]}
              anonymity={{ anonymous: 0, named: 0 }}
              participation={{ participating: 0, lurking: 0 }}
              joins={[]}
            />
          ),
        },
      ]}
    />
  );
}
