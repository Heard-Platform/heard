import { FundingPage } from "../screens/funding/FundingPage";

export function FundingPageStory() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="h-[800px] relative overflow-y-auto">
        <FundingPage
          getFundingStats={async () => {
            console.log("[Story] getFundingStats");
            return { success: true, data: { totalDollars: 1850, donorCount: 7 } };
          }}
          createCheckoutSession={async (amount) => {
            console.log("[Story] createCheckoutSession", { amount });
            return { success: true, data: { url: "http://localhost:3000/fund" } };
          }}
        />
      </div>
    </div>
  );
}
