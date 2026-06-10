import { FundingPage } from "../screens/funding/FundingPage";

export function FundingPageStory() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="h-[800px] relative overflow-y-auto">
        <FundingPage />
      </div>
    </div>
  );
}
