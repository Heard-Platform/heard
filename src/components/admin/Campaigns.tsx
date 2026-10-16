import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Megaphone } from "lucide-react";
import { getMockWaymoCampaignFunnel, type CampaignFunnel } from "./campaigns-mock-data";
import { DateRangeFilter } from "./DateRangeFilter";
import { DEFAULT_DATE_RANGE_SELECTION, resolveDateRange, type DateRangeSelection } from "./date-range-presets";

const countArrivedUsers = (funnel: CampaignFunnel) =>
  funnel.arrivedViaFlyerScan + funnel.arrivedViaDirectUrl - funnel.arrivedViaBoth;

export function Campaigns() {
  const [dateRangeSelection, setDateRangeSelection] = useState<DateRangeSelection>(DEFAULT_DATE_RANGE_SELECTION);
  const waymoFunnel = getMockWaymoCampaignFunnel(resolveDateRange(dateRangeSelection, new Date()));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangeFilter selection={dateRangeSelection} onChange={setDateRangeSelection} />
      </div>
      <CampaignFunnelCard funnel={waymoFunnel} />
    </div>
  );
}

function CampaignFunnelCard({ funnel }: { funnel: CampaignFunnel }) {
  const arrived = countArrivedUsers(funnel);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Megaphone className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-semibold">{funnel.campaignName}</h2>
        <Badge variant="outline" className="ml-2">
          Mock data
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {arrived} users arrived: {funnel.arrivedViaFlyerScan} scanned a flyer,{" "}
        {funnel.arrivedViaDirectUrl} browsed to the direct URL ({funnel.arrivedViaBoth} did both)
      </p>
      <CampaignFunnelChart funnel={funnel} arrived={arrived} />
    </Card>
  );
}

function CampaignFunnelChart({ funnel, arrived }: { funnel: CampaignFunnel; arrived: number }) {
  if (arrived === 0) {
    return <div className="text-center py-8 text-muted-foreground">No users yet</div>;
  }

  const data = [
    { label: "Scanned flyer and/or visited URL", users: arrived },
    { label: "Added email on flyer screen", users: funnel.addedEmailOnFlyerScreen },
    { label: "Voted more than once", users: funnel.votedMoreThanOnce },
    { label: "Added a response", users: funnel.addedResponse },
    { label: "Viewed a 2nd post", users: funnel.viewedSecondPost },
    { label: "Voted on a 2nd post", users: funnel.votedOnSecondPost },
    { label: "Added email later", users: funnel.addedEmailLater },
  ];

  return (
    <ResponsiveContainer width="100%" height={data.length * 32 + 16}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 96, bottom: 8, left: 0 }}>
        <XAxis type="number" hide domain={[0, arrived]} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={220} />
        <Tooltip formatter={(value: number) => [value, "Users"]} />
        <Bar dataKey="users" fill="#9333EA" radius={[0, 3, 3, 0]}>
          <LabelList
            dataKey="users"
            position="right"
            style={{ fontSize: 12 }}
            formatter={(value: number) => `${value} (${Math.round((value / arrived) * 100)}%)`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
