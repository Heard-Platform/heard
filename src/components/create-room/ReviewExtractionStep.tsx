import { useState } from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Sparkles, Check, UserCheck, Clock, Youtube, AlertCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { FunSheetCard } from "../FunSheet";
import { AdvancedFeatures } from "./AdvancedFeatures";
import { SeedStatements } from "./SeedStatements";
import type { DemographicQuestion } from "../../types";

interface ReviewExtractionStepProps {
  topic: string;
  statements: string[];
  isUploadingImage?: boolean;
  uploadedImageUrl?: string | null;
  youtubeUrl?: string;
  debateLength: number;
  allowAnonymousVoting: boolean;
  demographicQuestions: DemographicQuestion[];
  showAdvancedFeatures?: boolean;
  hideTopicAndStatements?: boolean;
  onTopicChange: (topic: string) => void;
  onStatementsChange: (statements: string[]) => void;
  onImageUpload: (file: File) => void;
  onYoutubeUrlChange: (url: string) => void;
  onDebateLengthChange: (length: number) => void;
  onAllowAnonymousVotingChange: (value: boolean) => void;
  onDemographicQuestionsChange: (questions: DemographicQuestion[]) => void;
}

export function ReviewExtractionStep({
  topic,
  statements,
  isUploadingImage,
  uploadedImageUrl,
  youtubeUrl,
  debateLength,
  allowAnonymousVoting,
  demographicQuestions,
  showAdvancedFeatures = false,
  hideTopicAndStatements = false,
  onTopicChange,
  onStatementsChange,
  onImageUpload,
  onYoutubeUrlChange,
  onDebateLengthChange,
  onAllowAnonymousVotingChange,
  onDemographicQuestionsChange,
}: ReviewExtractionStepProps) {
  const [editingStatementIndex, setEditingStatementIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newStatementText, setNewStatementText] = useState("");
  const [showCustomDateTime, setShowCustomDateTime] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");

  const blueGradientBg = "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100";
  const dashedBlueBorder = "border-2 border-dashed border-blue-300 hover:border-blue-400";
  const uploadButtonBase = "w-full h-auto py-4";
  const statementCardBg = "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 transition-all hover:border-blue-300";
  const iconBlue = "w-5 h-5 text-blue-500";
  const labelText = "text-base text-slate-700";
  const helperText = "text-xs text-slate-500";
  const helperTextCenter = "text-xs text-slate-500 text-center";
  const textareaWhite = "w-full min-h-[80px] resize-none bg-white border-blue-200";
  const primaryButton = "bg-blue-600 hover:bg-blue-700";
  const iconButtonBase = "h-8 w-8 p-0 bg-white/80";
  const smallIcon = "w-3.5 h-3.5";

  const handleDeleteStatement = (index: number) => {
    onStatementsChange(statements.filter((_, i) => i !== index));
  };

  const handleAddNewStatement = () => {
    const trimmedText = newStatementText.trim();
    if (trimmedText) {
      onStatementsChange([...statements, trimmedText]);
      setNewStatementText("");
      setIsAddingNew(false);
    }
  };

  const handleDateOrTimeChange = (date: string, time: string) => {
    const dateTimeStr = `${date}T${time}`;
    const selectedDate = new Date(dateTimeStr);
    const now = new Date();
    const diffInMinutes = Math.floor((selectedDate.getTime() - now.getTime()) / (1000 * 60));
    if (diffInMinutes > 0) {
      onDebateLengthChange(diffInMinutes);
    }
  };

  const handleDateChange = (date: string) => {
    setCustomDate(date);
    if (date && customTime) {
      handleDateOrTimeChange(date, customTime);
    }
  };

  const handleTimeChange = (time: string) => {
    setCustomTime(time);
    if (customDate && time) {
      handleDateOrTimeChange(customDate, time);
    }
  };

  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const initializeCustomDateTime = () => {
    const lengthInMins = debateLength || 60;
    const lengthInMs = lengthInMins * 60 * 1000;
    const date = new Date(Date.now() + lengthInMs);
    setCustomDate(date.toISOString().split('T')[0]);
    setCustomTime(date.toTimeString().slice(0, 5));
  };

  const isDateTimeInPast = () => {
    if (!customDate || !customTime) return false;
    const dateTimeStr = `${customDate}T${customTime}`;
    const selectedDate = new Date(dateTimeStr);
    const now = new Date();
    return selectedDate.getTime() <= now.getTime();
  };

  return (
    <>
      {/* Topic */}
      {!hideTopicAndStatements && (
        <FunSheetCard delay={0.15}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className={iconBlue} />
              <Label htmlFor="topic-input" className={labelText}>
                Conversation Topic
              </Label>
            </div>
            <Textarea
              id="topic-input"
              placeholder="Edit the conversation topic..."
              maxLength={200}
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              className="min-h-[60px] resize-none bg-white border-blue-200 hover:border-blue-300 focus:border-blue-400 transition-colors placeholder:text-slate-400"
              rows={2}
            />
            <div className="flex justify-end">
              <span className={helperText}>
                {topic.length}/200
              </span>
            </div>
          </div>
        </FunSheetCard>
      )}

      {/* Image Upload Section */}
      {onImageUpload && (
        <FunSheetCard delay={0.2}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className={iconBlue} />
              <Label className={labelText}>
                Add cover image (optional)
              </Label>
            </div>
            
            <input
              type="file"
              id="conversation-image"
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
              onClick={() => document.getElementById("conversation-image")?.click()}
              disabled={isUploadingImage}
              className={`${uploadButtonBase} ${blueGradientBg} ${dashedBlueBorder}`}
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
              Make your post stand out with a cover image
            </p>
          </div>
        </FunSheetCard>
      )}

      {/* YouTube URL Section */}
      {onYoutubeUrlChange && (
        <FunSheetCard delay={0.25}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Youtube className={iconBlue} />
              <Label className={labelText}>
                Add YouTube video URL (optional)
              </Label>
            </div>
            
            <Input
              type="url"
              id="youtube-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl || ""}
              onChange={(e) => onYoutubeUrlChange?.(e.target.value)}
              className={`${uploadButtonBase} ${blueGradientBg} ${dashedBlueBorder}`}
            />
            
            <p className={helperTextCenter}>
              Add a YouTube video to enhance your post
            </p>
          </div>
        </FunSheetCard>
      )}

      {/* Extracted Statements */}
      {!hideTopicAndStatements && (
        <FunSheetCard delay={0.25}>
          <SeedStatements
            statements={statements}
            onStatementsChange={onStatementsChange}
            variant="blue"
          />
        </FunSheetCard>
      )}

      {/* Conversation Length */}
      <FunSheetCard delay={0.3}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className={iconBlue} />
            <Label className={labelText}>
              Length
            </Label>
          </div>
          
          <p className={helperTextCenter}>
            How long should this run before closing?
          </p>
          
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
                onClick={() => {
                  onDebateLengthChange(minutes);
                  setShowCustomDateTime(false);
                }}
                className={debateLength === minutes ? primaryButton : "hover:bg-blue-50"}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowCustomDateTime(!showCustomDateTime);
                if (!showCustomDateTime) {
                  initializeCustomDateTime();
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              {showCustomDateTime ? "Hide custom date" : "Set custom end date"}
            </button>
          </div>

          {showCustomDateTime && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={statementCardBg}>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="custom-date" className="text-sm text-slate-700 block mb-2">
                      Date
                    </Label>
                    <Input
                      type="date"
                      id="custom-date"
                      min={getMinDate()}
                      value={customDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full bg-white border-blue-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-time" className="text-sm text-slate-700 block mb-2">
                      Time
                    </Label>
                    <Input
                      type="time"
                      id="custom-time"
                      value={customTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="w-full bg-white border-blue-200"
                    />
                  </div>
                  {isDateTimeInPast() && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">
                        The selected date and time is in the past. Please choose a future date and time.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
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
              <Label htmlFor="allow-anon" className={`${labelText} flex items-center gap-2 cursor-pointer`}>
                <UserCheck className={iconBlue} />
                Allow Anonymous Participation
              </Label>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                This encourages rapid participation by making it so people with the link can vote and post the moment they click the link, without being asked to create an account.
              </p>
            </div>
          </div>
        </div>
      </FunSheetCard>

      {/* Advanced Features */}
      {showAdvancedFeatures && (
        <AdvancedFeatures
          demographicQuestions={demographicQuestions}
          onDemographicQuestionsChange={onDemographicQuestionsChange}
        />
      )}
    </>
  );
}