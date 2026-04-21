import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

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
  topicPlaceholder = "Enter your conversation topic...",
  description,
  topicBorderColor = "border-green-200 hover:border-green-300 focus:border-green-400",
  descriptionBorderColor = "border-green-200 hover:border-green-300 focus:border-green-400",
  onTopicChange,
  onDescriptionChange,
}: TopicDescriptionFieldsProps) {
  return (
    <div className="space-y-1">
      <div className="space-y-2">
        <Label htmlFor="topic-input" className="text-sm text-slate-500">
          Topic
        </Label>
        <Textarea
          id="topic-input"
          placeholder={topicPlaceholder}
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
          Description <span className="text-slate-400">(optional)</span>
        </Label>
        <Textarea
          id="description-input"
          placeholder="Add more context for participants..."
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
