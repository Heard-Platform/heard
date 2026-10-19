import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from "recharts";
import { Card } from "../ui/card";
import { Loader2, Megaphone } from "lucide-react";
import { adminApi } from "../../utils/admin-api";
import type { CampaignFunnel, CampaignFunnelSteps } from "../../types";
import { DateRangeFilter } from "./DateRangeFilter";
import { DEFAULT_DATE_RANGE_SELECTION, resolveDateRange, type DateRangeSelection } from "./date-range-presets";

const WAYMO_CAMPAIGN_KEY = "waymo";

const FUNNEL_STEPS: { key: keyof CampaignFunnelSteps; label: string }[] = [
  { key: "arrived", label: "Arrived" },
  { key: "didAnythingMore", label: "Did anything more" },
  { key: "addedEmailOnFlyerScreen", label: "Added email on flyer screen" },
  { key: "votedMoreThanOnce", label: "Voted more than once" },
  { key: "addedResponse", label: "Added a response" },
  { key: "viewedSecondPost", label: "Viewed a 2nd post" },
  { key: "votedOnSecondPost", label: "Voted on a 2nd post" },
  { key: "addedEmailLater", label: "Added email later" },
];

const CHANNELS = [
  { key: "flyerScan", label: "Scanned flyer", color: "#9333EA" },
  { key: "directUrl", label: "Direct URL", color: "#0D9488" },
] as const;

const formatShareOf = (total: number) => (value: number) =>
  total > 0 ? `${value} (${Math.round((value / total) * 100)}%)` : `${value}`;

interface CampaignsProps {
  adminKey: string;
}

export function Campaigns({ adminKey }: CampaignsProps) {
  const [dateRangeSelection, setDateRangeSelection] = useState<DateRangeSelection>(DEFAULT_DATE_RANGE_SELECTION);
  const [funnel, setFunnel] = useState<CampaignFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const fetchFunnel = async () => {
      setLoading(true);
      setError(null);
      const { from, to } = resolveDateRange(dateRangeSelection, new Date());
      const response = await adminApi.getCampaignFunnel(adminKey, WAYMO_CAMPAIGN_KEY, {
        from: from?.getTime() ?? null,
        to: to.getTime(),
      });
      if (!isCurrent) return;
      if (response.success && response.data) {
        setFunnel(response.data.funnel);
      } else {
        setError(response.error ?? "Failed to load campaign funnel");
      }
      setLoading(false);
    };

    fetchFunnel();
    return () => {
      isCurrent = false;
    };
  }, [adminKey, dateRangeSelection]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangeFilter selection={dateRangeSelection} onChange={setDateRangeSelection} />
      </div>
      {loading ? (
        <Card className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        </Card>
      ) : error || !funnel ? (
        <Card className="p-6 text-center text-red-600">{error}</Card>
      ) : (
        <CampaignFunnelCard funnel={funnel} />
      )}
    </div>
  );
}

function CampaignFunnelCard({ funnel }: { funnel: CampaignFunnel }) {
  const arrived = funnel.flyerScan.arrived + funnel.directUrl.arrived;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Megaphone className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-semibold">{funnel.campaignName}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {arrived} users arrived: {funnel.flyerScan.arrived} first scanned a flyer,{" "}
        {funnel.directUrl.arrived} first browsed to the direct URL ({funnel.arrivedViaBoth} did both).
        Bar labels are a share of all arrivals; hover for each channel's share of its own arrivals.
      </p>
      {arrived === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No users yet</div>
      ) : (
        <CampaignFunnelChart funnel={funnel} />
      )}
    </Card>
  );
}

function CampaignFunnelChart({ funnel }: { funnel: CampaignFunnel }) {
  const data = FUNNEL_STEPS.map(({ key, label }) => ({
    label,
    flyerScan: funnel.flyerScan[key],
    directUrl: funnel.directUrl[key],
    total: funnel.flyerScan[key] + funnel.directUrl[key],
  }));
  const arrived = funnel.flyerScan.arrived + funnel.directUrl.arrived;
  const lastChannel = CHANNELS[CHANNELS.length - 1];

  return (
    <ResponsiveContainer width="100%" height={data.length * 40 + 48}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 96, bottom: 8, left: 0 }}>
        <XAxis type="number" hide domain={[0, arrived]} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={200} />
        <Tooltip
          formatter={(value: number, _name, item) =>
            formatShareOf(funnel[item.dataKey as (typeof CHANNELS)[number]["key"]].arrived)(value)
          }
        />
        <Legend />
        {CHANNELS.map((channel) => (
          <Bar
            key={channel.key}
            dataKey={channel.key}
            name={channel.label}
            stackId="channel"
            fill={channel.color}
            radius={channel.key === lastChannel.key ? [0, 3, 3, 0] : 0}
          >
            {channel.key === lastChannel.key && (
              <LabelList dataKey="total" position="right" style={{ fontSize: 11 }} formatter={formatShareOf(arrived)} />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
