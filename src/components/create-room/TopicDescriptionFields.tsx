import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useTranslation } from "react-i18next";

interface TopicDescriptionFieldsProps {
  topic: string;
  topicPlaceholder?: string;
  description: string;
  topicBorderColor?: string;
  descriptionBorderColor?: string;
  onTopicChange: (topic: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function TopicDescriptionFields({
  topic,
  topicPlaceholder,
  description,
  topicBorderColor = "border-green-200 hover:border-green-300 focus:border-green-400",
  descriptionBorderColor = "border-green-200 hover:border-green-300 focus:border-green-400",
  onTopicChange,
  onDescriptionChange,
}: TopicDescriptionFieldsProps) {
  const { t } = useTranslation("create");
  return (
    <div className="space-y-1">
      <div className="space-y-2">
        <Label htmlFor="topic-input" className="text-sm text-slate-500">
          {t("topicLabel")}
        </Label>
        <Textarea
          id="topic-input"
          placeholder={topicPlaceholder ?? t("topicPlaceholder")}
          maxLength={200}
          value={topic}
          rows={2}
          className={`min-h-[60px] resize-none bg-white transition-colors placeholder:text-slate-400 ${topicBorderColor}`}
          onChange={(e) => onTopicChange(e.target.value)}
        />
        <div className="flex justify-end">
          <span className="text-xs text-slate-500">{topic.length}/200</span>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Label htmlFor="description-input" className="text-sm text-slate-500">
          {t("descriptionLabel")} <span className="text-slate-400">{t("optionalParen")}</span>
        </Label>
        <Textarea
          id="description-input"
          placeholder={t("descriptionPlaceholder")}
          maxLength={500}
          value={description}
          rows={2}
          className={`min-h-[50px] resize-none bg-white transition-colors placeholder:text-slate-400 ${descriptionBorderColor}`}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        <div className="flex justify-end">
          <span className="text-xs text-slate-500">{description.length}/500</span>
        </div>
      </div>
    </div>
  );
}
