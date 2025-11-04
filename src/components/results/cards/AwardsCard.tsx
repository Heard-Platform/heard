import { Trophy } from "lucide-react";
import type { Statement } from "../../../types";
import { analyzeStatements } from "../utils";
import { CardHeader } from "../CardHeader";
import { AwardCard } from "../AwardCard";

interface AwardsCardProps {
  statements: Statement[];
}

export function AwardsCard({ statements }: AwardsCardProps) {
  const analysis = analyzeStatements(statements);

  // Find the most controversial (spiciest) statement
  const spiciestTake = analysis.controversial[0];

  // Find minority cluster (unicorn opinion)
  const unicornOpinion =
    analysis.clusters.length > 0
      ? analysis.clusters.sort((a, b) => a.size - b.size)[0]
          ?.statements[0]
      : null;

  // Find best bridge
  const bestBridge = analysis.byType.bridge[0];

  return (
    <div className="space-y-4">
      <CardHeader
        title="🎉 AWARDS 🎉"
        subtitle="Celebrating the best contributions"
        gradientFrom="from-purple-600"
        gradientTo="to-pink-600"
      />

      <div className="grid grid-cols-2 gap-3">
        {/* Most Persuasive */}
        {analysis.byAgrees[0] && (
          <AwardCard
            emoji="👑"
            title="Most Persuasive"
            value={analysis.byAgrees[0].agrees}
            text={analysis.byAgrees[0].text}
            gradientFrom="from-yellow-50"
            gradientTo="to-amber-100"
            borderColor="border-yellow-400"
            textColor="text-yellow-800"
            valueColor="text-yellow-600"
            delay={0.3}
            showShimmer
          />
        )}

        {/* Spiciest Take */}
        {spiciestTake && (
          <AwardCard
            emoji="🌶️"
            title="Spiciest Take"
            value={spiciestTake.agrees + spiciestTake.disagrees}
            text={spiciestTake.text}
            gradientFrom="from-orange-50"
            gradientTo="to-red-100"
            borderColor="border-orange-400"
            textColor="text-orange-800"
            valueColor="text-orange-600"
            delay={0.4}
          />
        )}

        {/* Unicorn Opinion */}
        {unicornOpinion && (
          <AwardCard
            emoji="🦄"
            title="Unicorn Opinion"
            value={unicornOpinion.agrees}
            text={unicornOpinion.text}
            gradientFrom="from-purple-50"
            gradientTo="to-pink-100"
            borderColor="border-purple-400"
            textColor="text-purple-800"
            valueColor="text-purple-600"
            delay={0.5}
          />
        )}

        {/* Bridge Builder */}
        {bestBridge && (
          <AwardCard
            emoji="🌉"
            title="Bridge Builder"
            value={bestBridge.agrees}
            text={bestBridge.text}
            gradientFrom="from-green-50"
            gradientTo="to-emerald-100"
            borderColor="border-green-400"
            textColor="text-green-800"
            valueColor="text-green-600"
            delay={0.6}
          />
        )}
      </div>
    </div>
  );
}