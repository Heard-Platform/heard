import { Trophy } from "lucide-react";
import type { Statement } from "../../../types";
import { analyzeStatements, getAgreePercent, getAwardWinners } from "../utils";
import { CardHeader } from "../CardHeader";
import { AwardCard } from "../AwardCard";

interface AwardsCardProps {
  statements: Statement[];
}

export function AwardsCard({ statements }: AwardsCardProps) {
  const analysis = analyzeStatements(statements);
  const { mostPersuasive, spiciest, unicorn, bridge } = getAwardWinners(analysis);

  return (
    <div className="space-y-4">
      <CardHeader
        icon={<Trophy className="w-6 h-6 text-purple-500" />}
        title="🎉 AWARDS 🎉"
        subtitle="Celebrating the best contributions"
        gradientFrom="from-purple-600"
        gradientTo="to-pink-600"
      />

      <div className="space-y-2">
        {/* Most Persuasive */}
        {mostPersuasive && (
          <AwardCard
            emoji="👑"
            title="Most Persuasive"
            value={getAgreePercent(mostPersuasive)}
            text={mostPersuasive.text}
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
        {spiciest && (
          <AwardCard
            emoji="🌶️"
            title="Spiciest Take"
            value={getAgreePercent(spiciest)}
            text={spiciest.text}
            gradientFrom="from-orange-50"
            gradientTo="to-red-100"
            borderColor="border-orange-400"
            textColor="text-orange-800"
            valueColor="text-orange-600"
            delay={0.4}
          />
        )}

        {/* Unicorn Opinion */}
        {unicorn && (
          <AwardCard
            emoji="🦄"
            title="Unicorn Opinion"
            value={getAgreePercent(unicorn)}
            text={unicorn.text}
            gradientFrom="from-purple-50"
            gradientTo="to-pink-100"
            borderColor="border-purple-400"
            textColor="text-purple-800"
            valueColor="text-purple-600"
            delay={0.5}
          />
        )}

        {/* Bridge Builder */}
        {bridge && (
          <AwardCard
            emoji="🌉"
            title="Bridge Builder"
            value={getAgreePercent(bridge)}
            text={bridge.text}
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
