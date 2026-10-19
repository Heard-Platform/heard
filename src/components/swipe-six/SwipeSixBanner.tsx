import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { FEED_CARD_WIDTH } from "../../utils/constants/general";
import { SWIPE_SIX_TITLE } from "./SwipeSixScreen";

export function SwipeSixBanner({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={FEED_CARD_WIDTH}
    >
      <Card className="heard-card-bg overflow-hidden">
        <div className="flex items-center gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-snug text-foreground">{SWIPE_SIX_TITLE}</p>
            <p className="text-sm leading-snug secondary-text">
              Weigh in on six things people are talking about today. Takes a minute.
            </p>
          </div>
          <Button onClick={onStart}>Start</Button>
        </div>
      </Card>
    </motion.div>
  );
}
