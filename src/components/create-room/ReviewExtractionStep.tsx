import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { TopicDescriptionFields } from "./TopicDescriptionFields";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Sparkles, Check, UserCheck, Clock, AlertCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { FunSheetCard } from "../FunSheet";
import { AdvancedFeatures } from "./AdvancedFeatures";
import { SeedStatements } from "./SeedStatements";
import type { NewDemographicQuestion, Cover, CoverType } from "../../types";
import { FeatureFlags, isFeatureEnabled } from "../../utils/constants/feature-flags";

interface ReviewExtractionStepProps {
  topic: string;
  description: string;
  statements: string[];
  cover: Cover | null;
  isUploadingImage?: boolean;
  debateLength: number;
  allowAnonymousVoting: boolean;
  demographicQuestions: NewDemographicQuestion[];
  hideTopicAndStatements?: boolean;
  onTopicChange: (topic: string) => void;
  onDescriptionChange: (description: string) => void;
  onStatementsChange: (statements: string[]) => void;
  onImageUpload: (file: File) => void;
  onCoverChange: (cover: Cover | null) => void;
  onDebateLengthChange: (length: number) => void;
  onAllowAnonymousVotingChange: (value: boolean) => void;
  onDemographicQuestionsChange: (questions: NewDemographicQuestion[]) => void;
}

type CoverOptions = "none" | CoverType;
const COVER_OPTIONS: CoverOptions[] = ["none", "image", "youtube"];

export function ReviewExtractionStep({
  topic,
  description,
  statements,
  cover,
  isUploadingImage,
  debateLength,
  allowAnonymousVoting,
  demographicQuestions,
  hideTopicAndStatements = false,
  onTopicChange,
  onDescriptionChange,
  onStatementsChange,
  onImageUpload,
  onCoverChange,
  onDebateLengthChange,
  onAllowAnonymousVotingChange,
  onDemographicQuestionsChange,
}: ReviewExtractionStepProps) {
  const { t } = useTranslation("create");
  const showAdvancedFeatures = isFeatureEnabled(FeatureFlags.DEMOGRAPHICS);

  const [coverType, setCoverType] = useState<CoverOptions>(
    cover?.type === "image" ? "image" : cover?.type === "youtube" ? "youtube" : "none"
  );

  const handleCoverTypeChange = (type: CoverOptions) => {
    if (type === coverType) return;
    setCoverType(type);
    if (type === "none") onCoverChange(null);
  };

  const [showCustomDateTime, setShowCustomDateTime] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");

  const blueGradientBg = "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100";
  const dashedBlueBorder = "border-2 border-dashed border-blue-300 hover:border-blue-400";
  const uploadButtonBase = "w-full h-auto py-4";
  const statementCardBg = "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 transition-all hover:border-blue-300";
  const iconBlue = "w-5 h-5 text-blue-500";
  const labelText = "text-base text-slate-700";
  const helperTextCenter = "text-xs text-slate-500 text-center";
  const primaryButton = "bg-blue-600 hover:bg-blue-700";

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
      {!hideTopicAndStatements && (
        <FunSheetCard delay={0.15}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className={iconBlue} />
              <span className={labelText}>{t("conversationLabel")}</span>
            </div>
            <TopicDescriptionFields
              topic={topic}
              description={description}
              topicBorderColor="border-blue-200 hover:border-blue-300 focus:border-blue-400"
              descriptionBorderColor="border-blue-200 hover:border-blue-300 focus:border-blue-400"
              topicPlaceholder={t("editTopicPlaceholder")}
              onTopicChange={onTopicChange}
              onDescriptionChange={onDescriptionChange}
            />
          </div>
        </FunSheetCard>
      )}

      <FunSheetCard delay={0.2}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className={iconBlue} />
            <Label className={labelText}>{t("coverCardOptional")}</Label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(COVER_OPTIONS).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleCoverTypeChange(type)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                  coverType === type
                    ? "border-blue-400 bg-blue-100 text-blue-700"
                    : "border-blue-200 bg-white text-slate-500 hover:border-blue-300"
                }`}
              >
                {type === "none" ? t("coverNone") : type === "image" ? t("coverImage") : t("coverYoutube")}
              </button>
            ))}
          </div>

          {/* Image input */}
          {coverType === "image" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <input
                type="file"
                id="conversation-image"
                accept="image/*"
                onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageUpload(f); }}
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
                    <span className="text-blue-700">{t("uploading")}</span>
                  </div>
                ) : cover?.type === "image" ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-700">{t("imageUploadedChange")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700">{t("chooseImage")}</span>
                  </div>
                )}
              </Button>
              {cover?.type === "image" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl overflow-hidden border-2 border-blue-200"
                >
                  <img src={cover.url} alt={t("previewAlt")} className="w-full h-48 object-cover" />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* YouTube input */}
          {coverType === "youtube" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Input
                type="url"
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={cover?.type === "youtube" ? cover.url : ""}
                onChange={(e) => onCoverChange(e.target.value ? { type: "youtube", url: e.target.value } : null)}
                className={`${blueGradientBg} ${dashedBlueBorder}`}
              />
              <p className={helperTextCenter}>{t("youtubeHelper")}</p>
            </motion.div>
          )}
        </div>
      </FunSheetCard>

      {!hideTopicAndStatements && (
        <SeedStatements
          statements={statements}
          onStatementsChange={onStatementsChange}
          variant="blue"
        />
      )}

      <FunSheetCard delay={0.3}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className={iconBlue} />
            <Label className={labelText}>
              {t("length")}
            </Label>
          </div>

          <p className={helperTextCenter}>
            {t("lengthHelper")}
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
              {showCustomDateTime ? t("hideCustomDate") : t("setCustomEndDate")}
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
                      {t("dateLabel")}
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
                      {t("timeLabel")}
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
                        {t("dateInPast")}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
        </div>
      </FunSheetCard>

      <FunSheetCard delay={0.35}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="require-account"
              checked={!allowAnonymousVoting}
              onCheckedChange={(checked: boolean) => onAllowAnonymousVotingChange(!checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="require-account" className={`${labelText} flex items-center gap-2 cursor-pointer`}>
                <UserCheck className={iconBlue} />
                {t("requireAccount")}
              </Label>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {t("requireAccountHelper")}
              </p>
            </div>
          </div>
        </div>
      </FunSheetCard>

      {showAdvancedFeatures && (
        <AdvancedFeatures
          demographicQuestions={demographicQuestions}
          onDemographicQuestionsChange={onDemographicQuestionsChange}
        />
      )}
    </>
  );
}
