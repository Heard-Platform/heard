import { Zap } from "lucide-react";
import type { Statement } from "../../../types";
import { analyzeStatements } from "../utils";
import { CardHeader } from "../CardHeader";
import { StatCard } from "../StatCard";

interface StatsCardProps {
  statements: Statement[];
}

export function StatsCard({ statements }: StatsCardProps) {
  const analysis = analyzeStatements(statements);

  return (
    <div className="space-y-4">
      <CardHeader
        icon={<Zap className="w-6 h-6 text-blue-500" />}
        title="📊 By The Numbers"
        subtitle="The stats behind the debate"
        gradientFrom="from-blue-600"
        gradientTo="to-green-600"
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={statements.filter((s) => s.agrees > 0).length}
          label="✨ Statements with agrees"
          gradientFrom="from-blue-50"
          gradientTo="to-blue-100"
          borderColor="border-blue-300"
          textColor="text-blue-600"
          delay={0.2}
        />

        <StatCard
          value={statements.reduce(
            (sum, s) => sum + s.agrees + s.disagrees + s.passes,
            0
          )}
          label="🗳️ Total votes cast"
          gradientFrom="from-purple-50"
          gradientTo="to-purple-100"
          borderColor="border-purple-300"
          textColor="text-purple-600"
          delay={0.3}
        />

        <StatCard
          value={analysis.byType.bridge.length}
          label="🌉 Bridges found"
          gradientFrom="from-green-50"
          gradientTo="to-green-100"
          borderColor="border-green-300"
          textColor="text-green-600"
          delay={0.4}
        />

        <StatCard
          value={analysis.byType.crux.length}
          label="🎯 Cruxes identified"
          gradientFrom="from-red-50"
          gradientTo="to-red-100"
          borderColor="border-red-300"
          textColor="text-red-600"
          delay={0.5}
        />

        <StatCard
          value={analysis.controversial.length}
          label="🌶️ Spicy takes"
          gradientFrom="from-orange-50"
          gradientTo="to-orange-100"
          borderColor="border-orange-300"
          textColor="text-orange-600"
          delay={0.6}
        />

        <StatCard
          value={analysis.clusters.length}
          label="🎯 Opinion clusters"
          gradientFrom="from-pink-50"
          gradientTo="to-pink-100"
          borderColor="border-pink-300"
          textColor="text-pink-600"
          delay={0.7}
        />
      </div>
    </div>
  );
}
