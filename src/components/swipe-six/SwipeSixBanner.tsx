import _ from "lodash";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { FEED_CARD_WIDTH } from "../../utils/constants/general";
import { SWIPE_SIX_TITLE } from "./SwipeSixScreen";

const SEGMENT_COUNT = 6;

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
            <div className="mt-2 flex gap-1">
              {_.times(SEGMENT_COUNT, (i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full bg-muted" />
              ))}
            </div>
          </div>
          <Button onClick={onStart}>Start</Button>
        </div>
      </Card>
    </motion.div>
  );
}
