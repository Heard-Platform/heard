import { FundingTeaser } from "../components/FundingTeaser";

export function FundingTeaserStory() {
  return (
    <div className="bg-slate-100 rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div
        className="h-[400px] relative"
        style={{ transform: "translateZ(0)" }}
      >
        <FundingTeaser
          getFundingStats={async () => {
            console.log("[Story] getFundingStats");
            return { success: true, data: { totalDollars: 1850, donorCount: 7 } };
          }}
        />
      </div>
    </div>
  );
}
