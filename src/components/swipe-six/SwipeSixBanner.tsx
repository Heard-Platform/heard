import { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { AnimatePresence, motion } from "motion/react";
import type { DebateRoom, SwipeSixItem } from "../../types";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { FEED_CARD_WIDTH } from "../../utils/constants/general";
import { TopicPill, topicPillColor } from "./TopicPill";

const SWIPE_SIX_TITLE = "Today's Swipe Six";
const TOPIC_ROTATION_MS = 5000;

interface SwipeSixBannerProps {
  items: SwipeSixItem[];
  onStart: () => void;
}

export function SwipeSixBanner({ items, onStart }: SwipeSixBannerProps) {
  const topics = useMemo(() => _.uniqBy(items.map((item) => item.room), "id"), [items]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={FEED_CARD_WIDTH}
    >
      <Card className="heard-card-bg overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-snug text-foreground">{SWIPE_SIX_TITLE}</p>
              <p className="text-sm leading-snug secondary-text">
                Weigh in on six things people are talking about today. Takes a minute.
              </p>
            </div>
            <Button onClick={onStart}>Start</Button>
          </div>
          {topics.length > 0 && <TopicCarousel topics={topics} />}
        </div>
      </Card>
    </motion.div>
  );
}

function TopicCarousel({ topics }: { topics: DebateRoom[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (topics.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % topics.length), TOPIC_ROTATION_MS);
    return () => clearInterval(timer);
  }, [topics]);

  const topic = topics[index % topics.length];

  return (
    <div className="-mx-4 mt-3 h-13 overflow-hidden px-4">
      <AnimatePresence mode="popLayout" initial={false}>
        <TopicPill key={topic.id} room={topic} colorClass={topicPillColor(index)} clamped />
      </AnimatePresence>
    </div>
  );
}
