import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { MessageCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FunSheetCard } from "../FunSheet";

const topicExamples = [
  "The Georgetown Trader Joe's parking lot is a nightmare and they should ban cars entirely",
  "Pineapple on pizza is actually good and you're all just cowards",
  "DC should ban right turns on red everywhere because drivers can't handle it",
  "The best way to eat Oreos is to dunk them in orange juice",
  "We should replace all lawns with native wildflower meadows",
  "Cats are better than dogs and I will die on this hill",
  "The DC Metro needs to run 24/7 like NYC or it's basically useless",
  "Breakfast foods are superior to all other meals and should be eaten at any time",
];

interface WriteRantStepProps {
  rant: string;
  isRantValid: boolean;
  remainingChars: number;
  onRantChange: (rant: string) => void;
}

export function WriteRantStep({
  rant,
  isRantValid,
  remainingChars,
  onRantChange,
}: WriteRantStepProps) {
  const [showExamples, setShowExamples] = useState(false);

  const handleExampleClick = (topic: string) => {
    onRantChange(topic);
    setShowExamples(false);
  };

  return (
    <>
      {/* Rant Input */}
      <FunSheetCard delay={0.2}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-teal-600" />
            <Label htmlFor="rant-input" className="text-base text-slate-700">
              What's got you fired up?
            </Label>
          </div>
          <Textarea
            id="rant-input"
            placeholder="Let it all out... tell us what you really think! 🔥"
            maxLength={2000}
            value={rant}
            onChange={(e) => onRantChange(e.target.value)}
            className="w-full min-h-[200px] resize-none bg-white border-teal-200 hover:border-teal-300 transition-colors placeholder:text-slate-400"
            rows={8}
          />
          <div className="flex justify-between items-center text-xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-100/50 flex items-center gap-1 h-auto px-2 py-1 -ml-2"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showExamples ? "Hide" : "Need inspiration?"}
            </Button>
            {rant.trim().length > 0 && !isRantValid && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-orange-600 flex items-center gap-1"
              >
                <span>⏳</span>
                Need {remainingChars} more character
                {remainingChars !== 1 ? "s" : ""}
              </motion.span>
            )}
            {isRantValid && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-emerald-600 flex items-center gap-1"
              >
                <span>🔥</span> That's the spirit!
              </motion.span>
            )}
            <span className="text-slate-500 ml-auto">
              {rant.length}/2000
            </span>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 bg-teal-50/50 border border-teal-100 rounded-lg">
            <span className="text-xs">🔒</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your rant is private — it's just used to draft the debate topic and won't be visible to other users.
            </p>
          </div>
        </div>
      </FunSheetCard>

      {/* Example Topics */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden -mt-3"
          >
            {topicExamples.map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(topic)}
                  className="w-full text-left justify-start h-auto py-3 px-4 bg-white/50 hover:bg-white border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 transition-all whitespace-normal"
                >
                  <span className="mr-2 flex-shrink-0">💡</span>
                  <span className="text-sm line-clamp-2 break-words">{topic}</span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}