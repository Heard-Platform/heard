import type { DateRange } from "./date-range-presets";

export interface CampaignFunnel {
  campaignName: string;
  arrivedViaFlyerScan: number;
  arrivedViaDirectUrl: number;
  arrivedViaBoth: number;
  addedEmailOnFlyerScreen: number;
  votedMoreThanOnce: number;
  addedResponse: number;
  viewedSecondPost: number;
  votedOnSecondPost: number;
  addedEmailLater: number;
}

type CampaignFunnelCounts = Omit<CampaignFunnel, "campaignName">;

const WAYMO_CAMPAIGN_START = new Date(2026, 9, 6);

const WAYMO_ALL_TIME_COUNTS: CampaignFunnelCounts = {
  arrivedViaFlyerScan: 214,
  arrivedViaDirectUrl: 37,
  arrivedViaBoth: 6,
  addedEmailOnFlyerScreen: 41,
  votedMoreThanOnce: 118,
  addedResponse: 19,
  viewedSecondPost: 52,
  votedOnSecondPost: 33,
  addedEmailLater: 8,
};

const fractionOfCampaignInRange = (range: DateRange, campaignStart: Date) => {
  const campaignMs = range.to.getTime() - campaignStart.getTime();
  const rangeStartMs = Math.max(range.from?.getTime() ?? 0, campaignStart.getTime());
  const overlapMs = Math.max(range.to.getTime() - rangeStartMs, 0);
  return campaignMs > 0 ? Math.min(overlapMs / campaignMs, 1) : 0;
};

export function getMockWaymoCampaignFunnel(range: DateRange): CampaignFunnel {
  const fraction = fractionOfCampaignInRange(range, WAYMO_CAMPAIGN_START);
  const scaledCounts = Object.fromEntries(
    Object.entries(WAYMO_ALL_TIME_COUNTS).map(([key, count]) => [key, Math.round(count * fraction)]),
  ) as CampaignFunnelCounts;
  return { campaignName: "Waymo flyering", ...scaledCounts };
}
