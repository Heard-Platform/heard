import { useState } from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Sparkles, MessageCircle, Edit2, Trash2, CheckCircle2, Image as ImageIcon, Loader2, Check, UserCheck, Clock } from "lucide-react";
import { motion } from "motion/react";
import { FunSheetCard } from "../FunSheet";

interface ReviewExtractionStepProps {
  topic: string;
  statements: string[];
  isUploadingImage?: boolean;
  uploadedImageUrl?: string | null;
  debateLength: number;
  allowAnonymousVoting: boolean;
  onTopicChange: (topic: string) => void;
  onStatementsChange: (statements: string[]) => void;
  onImageUpload?: (file: File) => void;
  onDebateLengthChange: (length: number) => void;
  onAllowAnonymousVotingChange: (value: boolean) => void;
}

export function ReviewExtractionStep({
  topic,
  statements,
  isUploadingImage,
  uploadedImageUrl,
  debateLength,
  allowAnonymousVoting,
  onTopicChange,
  onStatementsChange,
  onImageUpload,
  onDebateLengthChange,
  onAllowAnonymousVotingChange,
}: ReviewExtractionStepProps) {
  const [editingStatementIndex, setEditingStatementIndex] = useState<number | null>(null);

  const handleDeleteStatement = (index: number) => {
    onStatementsChange(statements.filter((_, i) => i !== index));
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

      {/* Image Upload Section */}
      {onImageUpload && (
        <FunSheetCard delay={0.2}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              <Label className="text-base text-slate-700">
                Add cover image (optional)
              </Label>
            </div>
            
            <input
              type="file"
              id="debate-image"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageUpload(file);
                }
              }}
              className="hidden"
              disabled={isUploadingImage}
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("debate-image")?.click()}
              disabled={isUploadingImage}
              className="w-full h-auto py-4 border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400"
            >
              {isUploadingImage ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-blue-700">Uploading...</span>
                </div>
              ) : uploadedImageUrl ? (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">Image uploaded! Click to change</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700">Choose an image</span>
                </div>
              )}
            </Button>
            
            {/* Thumbnail Preview */}
            {uploadedImageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 rounded-xl overflow-hidden border-2 border-blue-200"
              >
                <img
                  src={uploadedImageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              </motion.div>
            )}
            
            <p className="text-xs text-slate-500 text-center">
              Make your debate stand out with a cover image
            </p>
          </div>
        </FunSheetCard>
      )}

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

      {/* Debate Length */}
      <FunSheetCard delay={0.3}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <Label className="text-base text-slate-700">
              Length
            </Label>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { minutes: 10, label: '10m' },
              { minutes: 60, label: '1h' },
              { minutes: 720, label: '12h' },
              { minutes: 1440, label: '24h' },
              { minutes: 4320, label: '3d' },
              { minutes: 10080, label: '7d' },
            ].map(({ minutes, label }) => (
              <Button
                key={minutes}
                type="button"
                variant={debateLength === minutes ? "default" : "outline"}
                onClick={() => onDebateLengthChange(minutes)}
                className={debateLength === minutes ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50"}
              >
                {label}
              </Button>
            ))}
          </div>
          
          <p className="text-xs text-slate-500 text-center">
            How long should this run before closing?
          </p>
        </div>
      </FunSheetCard>

      {/* Allow Anonymous Voting */}
      <FunSheetCard delay={0.35}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="allow-anon"
              checked={allowAnonymousVoting}
              onCheckedChange={(checked: boolean) => onAllowAnonymousVotingChange(checked === true)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="allow-anon" className="text-base text-slate-700 flex items-center gap-2 cursor-pointer">
                <UserCheck className="w-5 h-5 text-blue-500" />
                Allow Anonymous Participation
              </Label>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                This encourages rapid participation by making it so people with the link can vote and post the moment they click the link, without being asked to create an account.
              </p>
            </div>
          </div>
        </div>
      </FunSheetCard>
    </>
  );
}