import { useState } from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Sparkles, MessageCircle, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { FunSheetCard } from "../FunSheet";

interface ReviewExtractionStepProps {
  topic: string;
  statements: string[];
  onTopicChange: (topic: string) => void;
  onStatementsChange: (statements: string[]) => void;
}

export function ReviewExtractionStep({
  topic,
  statements,
  onTopicChange,
  onStatementsChange,
}: ReviewExtractionStepProps) {
  const [editingStatementIndex, setEditingStatementIndex] = useState<number | null>(null);

  const handleDeleteStatement = (index: number) => {
    onStatementsChange(statements.filter((_, i) => i !== index));
  };

  const handleEditStatement = (index: number, newText: string) => {
    onStatementsChange(
      statements.map((stmt, i) => (i === index ? newText : stmt))
    );
  };

  return (
    <>
      {/* Topic */}
      <FunSheetCard delay={0.15}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <Label htmlFor="topic-input" className="text-base text-slate-700">
              Debate Topic
            </Label>
          </div>
          <Textarea
            id="topic-input"
            placeholder="Edit the debate topic..."
            maxLength={200}
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            className="min-h-[60px] resize-none bg-white border-blue-200 hover:border-blue-300 focus:border-blue-400 transition-colors placeholder:text-slate-400"
            rows={2}
          />
          <div className="flex justify-end">
            <span className="text-xs text-slate-500">
              {topic.length}/200
            </span>
          </div>
        </div>
      </FunSheetCard>

      {/* Extracted Statements */}
      <FunSheetCard delay={0.25}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base text-slate-700 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Seed Statements ({statements.length})
            </Label>
            <span className="text-xs text-slate-500">
              These will kickstart the debate
            </span>
          </div>

          <div className="space-y-3">
            {statements.map((stmt, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 transition-all hover:border-blue-300">
                  {editingStatementIndex === index ? (
                    <div className="space-y-2">
                      <Textarea
                        value={stmt}
                        onChange={(e) => {
                          const newStatements = [...statements];
                          newStatements[index] = e.target.value;
                          onStatementsChange(newStatements);
                        }}
                        className="w-full min-h-[80px] resize-none bg-white border-blue-200"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setEditingStatementIndex(null)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingStatementIndex(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-700 leading-relaxed pr-20">
                        {stmt}
                      </p>
                      <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingStatementIndex(index)}
                          className="h-8 w-8 p-0 bg-white/80 hover:bg-blue-100 border border-blue-200"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStatement(index)}
                          className="h-8 w-8 p-0 bg-white/80 hover:bg-red-100 border border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {statements.length === 0 && (
            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No statements yet</p>
            </div>
          )}
        </div>
      </FunSheetCard>
    </>
  );
}