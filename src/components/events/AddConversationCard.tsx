import { motion } from "motion/react";
import { PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

const EMPTY_STATE = {
  emoji: "🎉",
  headingKey: "emptyHeading",
  subtextKey: "emptySubtext",
  buttonKey: "emptyButton",
};

const DEFAULT_STATE = {
  emoji: "💬",
  headingKey: "defaultHeading",
  subtextKey: "defaultSubtext",
  buttonKey: "defaultButton",
};

export function AddConversationCard({
  isEmpty,
  onAddRoom,
}: {
  isEmpty: boolean;
  onAddRoom: () => void;
}) {
  const { t } = useTranslation("events");
  const { emoji, headingKey, subtextKey, buttonKey } = isEmpty ? EMPTY_STATE : DEFAULT_STATE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="overflow-hidden creation-bg-gradient border creation-border shadow-sm">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl creation-icon-bg flex items-center justify-center text-3xl shadow-md">
            {emoji}
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">{t(headingKey)}</p>
            <p className="text-sm text-muted-foreground">{t(subtextKey)}</p>
          </div>
          <Button onClick={onAddRoom} className="gap-2 heard-primary-gradient normal-text shadow-md">
            <PlusCircle className="w-4 h-4" />
            {t(buttonKey)}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
