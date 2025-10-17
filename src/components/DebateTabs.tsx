import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Brain, ThumbsUp, Trophy } from "lucide-react";
import { Badge } from "./ui/badge";

interface DebateTabsProps {
  activeTab: "ranting" | "voting" | "results";
  onTabChange: (tab: "ranting" | "voting" | "results") => void;
  hasRanted: boolean;
  hasVoted: boolean;
  children: {
    ranting: React.ReactNode;
    voting: React.ReactNode;
    results: React.ReactNode;
  };
}

export function DebateTabs({
  activeTab,
  onTabChange,
  hasRanted,
  hasVoted,
  children,
}: DebateTabsProps) {
  const canAccessVoting = hasRanted;
  const canAccessResults = hasRanted && hasVoted;

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        {/* Ranting Tab - Always accessible */}
        <TabsTrigger 
          value="ranting" 
          className="flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          <span>Rant</span>
          {hasRanted && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs h-5 bg-green-100 text-green-700">
              ✓
            </Badge>
          )}
        </TabsTrigger>

        {/* Voting Tab - Locked until rant submitted */}
        <TabsTrigger 
          value="voting"
          disabled={!canAccessVoting}
          className="flex items-center gap-2"
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Vote</span>
          {!canAccessVoting && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs h-5 bg-gray-100 text-gray-500">
              🔒
            </Badge>
          )}
          {canAccessVoting && hasVoted && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs h-5 bg-green-100 text-green-700">
              ✓
            </Badge>
          )}
        </TabsTrigger>

        {/* Results Tab - Locked until voted */}
        <TabsTrigger 
          value="results"
          disabled={!canAccessResults}
          className="flex items-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          <span>Results</span>
          {!canAccessResults && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs h-5 bg-gray-100 text-gray-500">
              🔒
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ranting" className="mt-0">
        {children.ranting}
      </TabsContent>

      <TabsContent value="voting" className="mt-0">
        {children.voting}
      </TabsContent>

      <TabsContent value="results" className="mt-0">
        {children.results}
      </TabsContent>
    </Tabs>
  );
}
