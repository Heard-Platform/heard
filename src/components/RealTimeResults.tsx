import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  Target,
  Zap,
  BarChart3,
  Eye,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Progress } from "./ui/progress";

interface Statement {
  id: string;
  text: string;
  author: string;
  votes: number;
  type?: "bridge" | "crux" | "plurality";
  isSpicy?: boolean;
}

interface RealTimeResultsProps {
  statements: Statement[];
  currentRound: string;
  currentSubPhase?: string;
}

interface ClusterData {
  id: string;
  theme: string;
  statements: Statement[];
  avgVotes: number;
  size: number;
}

export function RealTimeResults({
  statements,
  currentRound,
}: RealTimeResultsProps) {
  const [viewMode, setViewMode] = useState<
    "consensus" | "categories" | "clusters" | "trends"
  >("consensus");

  const analysis = useMemo(() => {
    // Sort by votes
    const byVotes = [...statements].sort(
      (a, b) => b.votes - a.votes,
    );

    // Group by type
    const byType = {
      bridge: statements
        .filter((s) => s.type === "bridge")
        .sort((a, b) => b.votes - a.votes),
      crux: statements
        .filter((s) => s.type === "crux")
        .sort((a, b) => b.votes - a.votes),
      plurality: statements
        .filter((s) => s.type === "plurality")
        .sort((a, b) => b.votes - a.votes),
      general: statements
        .filter((s) => !s.type)
        .sort((a, b) => b.votes - a.votes),
    };

    // Calculate consensus (statements with high positive votes)
    const consensus = byVotes.filter((s) => s.votes >= 3);
    const controversial = statements.filter(
      (s) => s.votes === 0 || (s.votes > 0 && s.votes < 3),
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
            s.text.toLowerCase().includes("benefit"),
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
            s.text.toLowerCase().includes("harm"),
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
            s.text.toLowerCase().includes("both"),
        ),
        avgVotes: 0,
        size: 0,
      },
    ]
      .map((cluster) => ({
        ...cluster,
        avgVotes:
          cluster.statements.length > 0
            ? cluster.statements.reduce(
                (sum, s) => sum + s.votes,
                0,
              ) / cluster.statements.length
            : 0,
        size: cluster.statements.length,
      }))
      .filter((cluster) => cluster.size > 0);

    return {
      byVotes,
      byType,
      consensus,
      controversial,
      clusters,
    };
  }, [statements]);

  const getTypeInfo = (type: string) => {
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

  const StatementMini = ({
    statement,
    showVotes = true,
  }: {
    statement: Statement;
    showVotes?: boolean;
  }) => (
    <motion.div
      layout
      className="p-3 border rounded-lg bg-card text-sm"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          @{statement.author}
        </span>
        <div className="flex items-center gap-1">
          {statement.type && (
            <Badge variant="secondary" className="text-xs">
              {getTypeInfo(statement.type).label}
            </Badge>
          )}
          {showVotes && (
            <Badge variant="outline" className="text-xs">
              {statement.votes} votes
            </Badge>
          )}
        </div>
      </div>
      <p className="leading-relaxed">{statement.text}</p>
    </motion.div>
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Live Results
        </h3>
        <Badge variant="outline" className="text-xs">
          {statements.length} statements
        </Badge>
      </div>

      <Tabs
        value={viewMode}
        onValueChange={(value) => setViewMode(value as any)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consensus" className="text-xs">
            Consensus
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">
            Categories
          </TabsTrigger>
          <TabsTrigger value="clusters" className="text-xs">
            Clusters
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs">
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consensus" className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                High Consensus ({analysis.consensus.length})
              </h4>
              {analysis.consensus.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analysis.consensus
                    .slice(0, 3)
                    .map((statement) => (
                      <StatementMini
                        key={statement.id}
                        statement={statement}
                      />
                    ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No clear consensus yet. Keep voting!
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-600" />
                Under Discussion (
                {analysis.controversial.length})
              </h4>
              {analysis.controversial.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {analysis.controversial
                    .slice(0, 2)
                    .map((statement) => (
                      <StatementMini
                        key={statement.id}
                        statement={statement}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {Object.entries(analysis.byType).map(
            ([type, typeStatements]) => {
              if (typeStatements.length === 0) return null;
              const info = getTypeInfo(type);
              const Icon = info.icon;

              return (
                <div
                  key={type}
                  className={`p-3 rounded-lg ${info.bg}`}
                >
                  <h4
                    className={`text-sm mb-2 flex items-center gap-2 ${info.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {info.label} ({typeStatements.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {typeStatements
                      .slice(0, 2)
                      .map((statement) => (
                        <StatementMini
                          key={statement.id}
                          statement={statement}
                        />
                      ))}
                  </div>
                </div>
              );
            },
          )}
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          {analysis.clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="p-3 border rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm">{cluster.theme}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{cluster.size} statements</span>
                  <span>
                    Avg: {cluster.avgVotes.toFixed(1)} votes
                  </span>
                </div>
              </div>
              <Progress
                value={
                  (cluster.avgVotes /
                    Math.max(
                      ...statements.map((s) => s.votes),
                    ) || 1) * 100
                }
                className="mb-2"
              />
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {cluster.statements
                  .slice(0, 1)
                  .map((statement) => (
                    <StatementMini
                      key={statement.id}
                      statement={statement}
                      showVotes={false}
                    />
                  ))}
              </div>
            </div>
          ))}
          {analysis.clusters.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Not enough data to show clusters yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-mono text-primary">
                {statements.filter((s) => s.votes > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">
                Statements with votes
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-mono text-primary">
                {statements.reduce(
                  (sum, s) => sum + s.votes,
                  0,
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Total votes cast
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-mono text-blue-600">
                {analysis.byType.bridge.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Bridges found
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-mono text-red-600">
                {analysis.byType.crux.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Cruxes identified
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm">Top Performers</h4>
            {analysis.byVotes
              .slice(0, 3)
              .map((statement, index) => (
                <div
                  key={statement.id}
                  className="flex items-center gap-3 p-2 border rounded"
                >
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div className="flex-1 text-xs truncate">
                    {statement.text}
                  </div>
                  <Badge className="text-xs">
                    {statement.votes}
                  </Badge>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}