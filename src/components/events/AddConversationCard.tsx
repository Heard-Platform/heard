import { motion } from "motion/react";
import { PlusCircle } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

const EMPTY_STATE = {
  emoji: "🎉",
  heading: "Get started",
  subtext: "Add a topic for your group to discuss and vote on",
  buttonLabel: "Add first conversation",
};

const DEFAULT_STATE = {
  emoji: "💬",
  heading: "Keep the conversations flowing",
  subtext: "Is there something else the group needs to talk about?",
  buttonLabel: "Add new conversation",
};

export function AddConversationCard({
  isEmpty,
  onAddRoom,
}: {
  isEmpty: boolean;
  onAddRoom: () => void;
}) {
  const { emoji, heading, subtext, buttonLabel } = isEmpty ? EMPTY_STATE : DEFAULT_STATE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="overflow-hidden creation-bg border creation-border shadow-sm">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl creation-icon-bg flex items-center justify-center text-3xl shadow-md">
            {emoji}
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">{heading}</p>
            <p className="text-sm text-muted-foreground">{subtext}</p>
          </div>
          <Button onClick={onAddRoom} className="gap-2 heard-primary-gradient text-white shadow-md">
            <PlusCircle className="w-4 h-4" />
            {buttonLabel}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
