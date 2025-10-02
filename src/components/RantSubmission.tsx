import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Brain, Send } from "lucide-react";

interface RantSubmissionProps {
  onSubmit: (text: string) => Promise<void>;
  isSubmitting?: boolean;
  hasSubmitted?: boolean;
  placeholder?: string;
}

export function RantSubmission({
  onSubmit,
  isSubmitting = false,
  hasSubmitted = false,
  placeholder = "Share your unfiltered thoughts on this topic...",
}: RantSubmissionProps) {
  const [rantText, setRantText] = useState("");

  const isValid = rantText.trim().length >= 50;
  const remainingChars = 50 - rantText.trim().length;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    
    try {
      await onSubmit(rantText.trim());
      setRantText("");
    } catch (error) {
      console.error("Failed to submit rant:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (hasSubmitted) {
    return (
      <Card className="p-6 bg-purple-50 border-purple-200">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="text-purple-900">Rant submitted!</h3>
            <p className="text-sm text-purple-700 mt-1">
              Waiting for other players to submit their rants. The AI will compile everyone's thoughts into debate statements.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-purple-900">Share Your Rant</h3>
              <p className="text-sm text-purple-700">
                Let it all out! AI will compile everyone's thoughts into structured debate points.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="rant-input" className="text-purple-900">
              Your unfiltered thoughts:
            </Label>
            <Textarea
              id="rant-input"
              value={rantText}
              onChange={(e) => setRantText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[120px] resize-none bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              maxLength={1000}
              disabled={isSubmitting}
            />
            
            <div className="flex justify-between items-center text-xs">
              {rantText.trim().length > 0 && !isValid && (
                <span className="text-orange-600">
                  Need {remainingChars} more character{remainingChars !== 1 ? 's' : ''} (min. 50)
                </span>
              )}
              {isValid && (
                <span className="text-green-600">
                  ✓ Rant looks good!
                </span>
              )}
              <span className="text-muted-foreground ml-auto">
                {rantText.length}/1000
              </span>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Rant"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}