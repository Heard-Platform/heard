import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Code2 } from "lucide-react";
import { RantSubmissionStory } from "../stories/RantSubmission.story";
import { GameScreenStory } from "../stories/GameScreen.story";
import { RealTimeResultsStory } from "../stories/RealTimeResults.story";

interface ComponentShowcaseProps {
  onExit: () => void;
}

export function ComponentShowcase({ onExit }: ComponentShowcaseProps) {
  // Load active tab from localStorage
  const getInitialTab = () => {
    try {
      return localStorage.getItem("showcaseActiveTab") || "rant-submission";
    } catch {
      return "rant-submission";
    }
  };

  const handleTabChange = (value: string) => {
    try {
      localStorage.setItem("showcaseActiveTab", value);
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              onClick={onExit}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit Showcase
            </Button>
            <div>
              <h1 className="text-slate-900 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                Component Showcase
              </h1>
              <p className="text-sm text-slate-600">
                Interactive component testing with mock data
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
            Development Mode
          </Badge>
        </div>

        {/* Component Tabs */}
        <Tabs 
          defaultValue={getInitialTab()} 
          className="w-full"
          onValueChange={handleTabChange}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="rant-submission">Rant Submission</TabsTrigger>
            <TabsTrigger value="game-screen">Game Screen</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="rant-submission">
            <RantSubmissionStory />
          </TabsContent>

          <TabsContent value="game-screen">
            <GameScreenStory />
          </TabsContent>

          <TabsContent value="results">
            <RealTimeResultsStory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
