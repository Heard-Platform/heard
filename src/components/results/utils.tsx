import { Users, Target, Zap, Eye, Crown, Medal, Award, Star } from "lucide-react";
import type { Statement } from "../../types";

export interface ClusterData {
  id: string;
  theme: string;
  statements: Statement[];
  avgVotes: number;
  size: number;
}

export const getTypeInfo = (type: string) => {
  switch (type) {
    case "bridge":
      return {
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
        label: "Bridges",
      };
    case "crux":
      return {
        icon: Target,
        color: "text-red-600",
        bg: "bg-red-50",
        label: "Cruxes",
      };
    case "plurality":
      return {
        icon: Zap,
        color: "text-purple-600",
        bg: "bg-purple-50",
        label: "Pluralities",
      };
    default:
      return {
        icon: Eye,
        color: "text-gray-600",
        bg: "bg-gray-50",
        label: "General",
      };
  }
};

export const getPodiumPosition = (index: number) => {
  switch (index) {
    case 0:
      return {
        icon: Crown,
        color: "text-yellow-500",
        bg: "bg-gradient-to-br from-yellow-50 to-amber-100",
        border: "border-yellow-300",
        label: "🥇 WINNER!",
        height: "h-32",
      };
    case 1:
      return {
        icon: Medal,
        color: "text-slate-400",
        bg: "bg-gradient-to-br from-slate-50 to-slate-100",
        border: "border-slate-300",
        label: "🥈 2nd Place",
        height: "h-24",
      };
    case 2:
      return {
        icon: Award,
        color: "text-amber-600",
        bg: "bg-gradient-to-br from-amber-50 to-orange-100",
        border: "border-amber-300",
        label: "🥉 3rd Place",
        height: "h-20",
      };
    default:
      return {
        icon: Star,
        color: "text-purple-500",
        bg: "bg-gradient-to-br from-purple-50 to-pink-50",
        border: "border-purple-200",
        label: `#${index + 1}`,
        height: "h-16",
      };
  }
};

export const analyzeStatements = (statements: Statement[]) => {
  // Sort by agrees
  const byAgrees = [...statements].sort((a, b) => b.agrees - a.agrees);

  // Group by type
  const byType = {
    bridge: statements
      .filter((s) => s.type === "bridge")
      .sort((a, b) => b.agrees - a.agrees),
    crux: statements
      .filter((s) => s.type === "crux")
      .sort((a, b) => b.agrees - a.agrees),
    plurality: statements
      .filter((s) => s.type === "plurality")
      .sort((a, b) => b.agrees - a.agrees),
    general: statements
      .filter((s) => !s.type)
      .sort((a, b) => b.agrees - a.agrees),
  };

  // Calculate consensus (statements with high agrees)
  const consensus = byAgrees.filter((s) => s.agrees >= 3);
  const controversial = statements.filter(
    (s) => s.agrees === 0 || s.disagrees > s.agrees
  );

  // Simple clustering by keywords (mock implementation)
  const clusters: ClusterData[] = [
    {
      id: "pro",
      theme: "Supportive Views",
      statements: statements.filter(
        (s) =>
          s.text.toLowerCase().includes("good") ||
          s.text.toLowerCase().includes("positive") ||
          s.text.toLowerCase().includes("benefit")
      ),
      avgVotes: 0,
      size: 0,
    },
    {
      id: "against",
      theme: "Critical Views",
      statements: statements.filter(
        (s) =>
          s.text.toLowerCase().includes("bad") ||
          s.text.toLowerCase().includes("negative") ||
          s.text.toLowerCase().includes("harm")
      ),
      avgVotes: 0,
      size: 0,
    },
    {
      id: "nuanced",
      theme: "Nuanced Views",
      statements: statements.filter(
        (s) =>
          s.text.toLowerCase().includes("but") ||
          s.text.toLowerCase().includes("however") ||
          s.text.toLowerCase().includes("both")
      ),
      avgVotes: 0,
      size: 0,
    },
  ]
    .map((cluster) => ({
      ...cluster,
      avgVotes:
        cluster.statements.length > 0
          ? cluster.statements.reduce((sum, s) => sum + s.agrees, 0) /
            cluster.statements.length
          : 0,
      size: cluster.statements.length,
    }))
    .filter((cluster) => cluster.size > 0);

  return {
    byAgrees,
    byType,
    consensus,
    controversial,
    clusters,
  };
};
