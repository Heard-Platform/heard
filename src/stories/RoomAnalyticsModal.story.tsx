import { useState } from "react";
import { Button } from "../components/ui/button";
import { RoomAnalyticsModal } from "../components/room/RoomAnalyticsModal";
import type {
  ReferrerShareCount,
  TrafficSourceCount,
} from "../components/room/RoomAnalyticsModal";
import {
  generateMockTrafficSources,
  generateMockReferrers,
} from "../components/room/analytics-mock";
import { StoryContainer } from "./StoryContainer";

const mixedSources: TrafficSourceCount[] = generateMockTrafficSources("room-mixed", 214);
const mixedReferrers: ReferrerShareCount[] = generateMockReferrers(
  "room-mixed-referrers",
  mixedSources.find((s) => s.key === "referral")?.count ?? 0,
);

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

const flyerCampaign: TrafficSourceCount[] = [
  { key: "flyer", count: 88 },
  { key: "referral", count: 22 },
  { key: "direct", count: 15 },
];
const flyerReferrers: ReferrerShareCount[] = generateMockReferrers("flyer-referrers", 22);

const emptyState: TrafficSourceCount[] = [];

function ModalTrigger({
  label,
  roomTopic,
  trafficSources,
  referrers,
}: {
  label: string;
  roomTopic: string;
  trafficSources: TrafficSourceCount[];
  referrers?: ReferrerShareCount[];
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
            />
          ),
        },
      ]}
    />
  );
}
