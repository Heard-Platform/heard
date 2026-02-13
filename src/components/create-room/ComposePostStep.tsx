import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Sparkles, Wand2, HelpCircle } from "lucide-react";
import { FunSheetCard } from "../FunSheet";
import { SeedStatements } from "./SeedStatements";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ComposePostStepProps {
  topic: string;
  statements: string[];
  onTopicChange: (topic: string) => void;
  onStatementsChange: (statements: string[]) => void;
  onSwitchToRantMode: () => void;
  showError: boolean;
}

export function ComposePostStep({
  topic,
  statements,
  onTopicChange,
  onStatementsChange,
  onSwitchToRantMode,
  showError,
}: ComposePostStepProps) {
  const iconGreen = "w-5 h-5 text-green-500";
  const labelText = "text-base text-slate-700";
  const helperText = "text-xs text-slate-500";

  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  return (
    <>
      <FunSheetCard delay={0.15}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className={iconGreen} />
            <Label htmlFor="topic-input" className={labelText}>
              Conversation Topic
            </Label>
          </div>
          <Textarea
            id="topic-input"
            placeholder="Enter your conversation topic..."
            maxLength={200}
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            className="min-h-[60px] resize-none bg-white border-green-200 hover:border-green-300 focus:border-green-400 transition-colors placeholder:text-slate-400"
            rows={2}
          />
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsHelpDialogOpen(true)}
              className="text-xs text-green-700 hover:text-green-900 hover:bg-green-100/50 flex items-center gap-1 h-auto px-2 py-1 -ml-2"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              How does this work?
            </Button>
            <span className={helperText}>
              {topic.length}/200
            </span>
          </div>
        </div>
      </FunSheetCard>

      <SeedStatements
        statements={statements}
        onStatementsChange={onStatementsChange}
        variant="green"
        showError={showError}
      />

      <FunSheetCard delay={0.25}>
        <div className="text-center space-y-3">
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600 mb-3">
              Prefer to start with a free-form rant instead?
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onSwitchToRantMode}
              className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-300 hover:border-purple-400"
            >
              <Wand2 className="w-4 h-4 mr-2 text-purple-600" />
              <span className="text-purple-700">Switch to Rant Mode</span>
            </Button>
          </div>
        </div>
      </FunSheetCard>

      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Example: How It Works</DialogTitle>
            <DialogDescription className="text-slate-600">
              Your <strong>topic</strong> describes what the conversation is about. Your <strong>seed statements</strong> are what people will vote on (agree/disagree/pass). People can also add their own statements to be voted on.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-sm text-slate-700">Topic (not voted on)</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Should our city invest more in public transportation?
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-sm text-slate-700">Seed Statements</span>
              </div>
              <div className="space-y-2">
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <p className="text-sm text-slate-700">Public transportation reduces traffic congestion and improves air quality</p>
                </div>
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <p className="text-sm text-slate-700">The cost of expanding public transit is too high for our city's budget</p>
                </div>
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <p className="text-sm text-slate-700">Investing in bike lanes would be more cost-effective than buses or trains</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                💡 People will see the topic at the top, then vote agree/disagree/pass on each statement. The system clusters people by how they vote to find common ground.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
