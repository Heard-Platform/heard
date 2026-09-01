import { useState } from "react";
import {
  Link2,
  Mail,
  QrCode,
  UserPlus,
  Share2,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  User,
  EyeOff,
  MessageSquare,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { RoomDebugDataPanel } from "./RoomDebugDataPanel";
import type { RoomDebugData } from "./RoomDebugDataPanel";

export type TrafficSourceKey =
  | "direct"
  | "newsletter"
  | "referral"
  | "flyer"
  | "social"
  | "other";

export interface TrafficSourceCount {
  key: TrafficSourceKey;
  count: number;
}

export interface ReferrerShareCount {
  id: string;
  shares: number;
}

export interface AnonymityBreakdown {
  anonymous: number;
  named: number;
}

export interface ParticipationBreakdown {
  participating: number;
  lurking: number;
}

const SOURCE_META: Record<
  TrafficSourceKey,
  { label: string; icon: typeof Link2; color: string; trackedYet?: boolean }
> = {
  direct: { label: "Direct link", icon: Link2, color: "#2a78d6" },
  newsletter: { label: "Newsletter", icon: Mail, color: "#008300" },
  referral: { label: "Friend referral", icon: UserPlus, color: "#e87ba4" },
  flyer: { label: "Flyer / QR code", icon: QrCode, color: "#eda100" },
  social: { label: "Social media", icon: Share2, color: "#1baf7a", trackedYet: false },
  other: { label: "Other / unknown", icon: HelpCircle, color: "#eb6834" },
};

const SOURCE_ORDER: TrafficSourceKey[] = [
  "direct",
  "newsletter",
  "referral",
  "flyer",
  "social",
  "other",
];

function ReferrerList({ referrers }: { referrers: ReferrerShareCount[] }) {
  const sorted = [...referrers].sort((a, b) => b.shares - a.shares);
  return (
    <div className="mt-2 ml-7 space-y-1 border-l pl-3">
      {sorted.map((referrer, i) => (
        <div
          key={referrer.id}
          className="flex items-center justify-between text-xs text-muted-foreground"
        >
          <span>Referrer #{i + 1}</span>
          <span>{referrer.shares} {referrer.shares === 1 ? "share" : "shares"}</span>
        </div>
      ))}
    </div>
  );
}

function TrafficSourceRow({
  sourceKey,
  count,
  pct,
  referrers,
}: {
  sourceKey: TrafficSourceKey;
  count: number;
  pct: number;
  referrers?: ReferrerShareCount[];
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = SOURCE_META[sourceKey];
  const Icon = meta.icon;
  const untracked = meta.trackedYet === false;
  const isExpandable = sourceKey === "referral" && !!referrers?.length;

  const row = (
    <div className={`flex items-center gap-3 ${untracked ? "opacity-50" : ""}`}>
      <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="truncate flex items-center gap-1">
            {meta.label}
            {isExpandable && (
              expanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )
            )}
          </span>
          <span className="text-muted-foreground text-xs shrink-0 ml-2">
            {untracked ? "Not tracked yet" : `${count} · ${pct}%`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          {!untracked && (
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: meta.color }}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (!isExpandable) return row;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left"
      >
        {row}
      </button>
      {expanded && <ReferrerList referrers={referrers!} />}
    </div>
  );
}

function TrafficSourcesSection({
  sources,
  referrers,
}: {
  sources: TrafficSourceCount[];
  referrers?: ReferrerShareCount[];
}) {
  const total = sources.reduce((sum, s) => sum + s.count, 0);
  const countByKey = new Map(sources.map((s) => [s.key, s.count]));
  const rows = SOURCE_ORDER.map((key) => ({ key, count: countByKey.get(key) ?? 0 }))
    .filter((row) => row.count > 0 || SOURCE_META[row.key].trackedYet === false)
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Traffic sources</h3>
      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          No traffic source data yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ key, count }) => (
            <TrafficSourceRow
              key={key}
              sourceKey={key}
              count={count}
              pct={total > 0 ? Math.round((count / total) * 100) : 0}
              referrers={key === "referral" ? referrers : undefined}
            />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground pt-3 mt-3 border-t">
        {total} total {total === 1 ? "join" : "joins"} tracked
      </p>
    </div>
  );
}

function AnonymitySection({ anonymous, named }: AnonymityBreakdown) {
  const total = anonymous + named;
  const rows = [
    { label: "Non-anonymous", count: named, icon: User, color: "#2a78d6" },
    { label: "Anonymous", count: anonymous, icon: EyeOff, color: "#8a8a8a" },
  ];

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Anonymous vs. non-anonymous</h3>
      {total === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          No participant data yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ label, count, icon: Icon, color }) => {
            const pct = Math.round((count / total) * 100);
            return (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate">{label}</span>
                    <span className="text-muted-foreground text-xs shrink-0 ml-2">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ParticipationSection({ participating, lurking }: ParticipationBreakdown) {
  const total = participating + lurking;
  const pct = total > 0 ? Math.round((participating / total) * 100) : 0;

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Participating vs. lurking</h3>
      {total === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          No participant data yet.
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="truncate">Participating</span>
              <span className="text-muted-foreground text-xs shrink-0 ml-2">
                {participating} · {pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: "#2a78d6" }}
              />
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground pt-3 mt-3 border-t">
        {participating} participating · {lurking} lurking
      </p>
    </div>
  );
}

function AnalyticsContent({
  trafficSources,
  referrers,
  anonymity,
  participation,
}: {
  trafficSources: TrafficSourceCount[];
  referrers?: ReferrerShareCount[];
  anonymity?: AnonymityBreakdown;
  participation?: ParticipationBreakdown;
}) {
  return (
    <div className="py-2 space-y-6">
      <TrafficSourcesSection sources={trafficSources} referrers={referrers} />
      {participation && <ParticipationSection {...participation} />}
      {anonymity && <AnonymitySection {...anonymity} />}
    </div>
  );
}

interface RoomAnalyticsModalProps {
  roomTopic: string;
  trafficSources: TrafficSourceCount[];
  referrers?: ReferrerShareCount[];
  anonymity?: AnonymityBreakdown;
  participation?: ParticipationBreakdown;
  isDeveloper?: boolean;
  debugData?: RoomDebugData | null;
  debugLoading?: boolean;
  onDebugTabOpen?: () => void;
  onClose: () => void;
}

export function RoomAnalyticsModal({
  roomTopic,
  trafficSources,
  referrers,
  anonymity,
  participation,
  isDeveloper,
  debugData,
  debugLoading,
  onDebugTabOpen,
  onClose,
}: RoomAnalyticsModalProps) {
  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent
        className={
          isDeveloper
            ? "max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            : "max-w-md w-full max-h-[90vh] overflow-y-auto"
        }
      >
        <DialogTitle className="line-clamp-1 pr-8">Room analytics</DialogTitle>
        <p className="text-xs text-muted-foreground line-clamp-1 -mt-2">{roomTopic}</p>

        {isDeveloper ? (
          <Tabs
            defaultValue="analytics"
            onValueChange={(value: string) => {
              if (value === "debug") onDebugTabOpen?.();
            }}
          >
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="debug">Debug data</TabsTrigger>
            </TabsList>
            <TabsContent value="analytics">
              <AnalyticsContent
                trafficSources={trafficSources}
                referrers={referrers}
                anonymity={anonymity}
                participation={participation}
              />
            </TabsContent>
            <TabsContent value="debug">
              <div className="py-2">
                {debugLoading && (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    Loading…
                  </div>
                )}
                {!debugLoading && debugData && <RoomDebugDataPanel data={debugData} />}
                {!debugLoading && !debugData && (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    Failed to load debug data.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <AnalyticsContent
            trafficSources={trafficSources}
            referrers={referrers}
            anonymity={anonymity}
            participation={participation}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
