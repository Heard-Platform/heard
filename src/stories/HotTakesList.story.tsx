import { useState } from "react";
import { HotTakesList } from "../components/create-room/HotTakesList";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "CreateRoom/HotTakesList",
};

const LIST_WIDTH_PX = 343;
const LIST_HEIGHT_PX = 260;

const SHORT_TAKES = ["A hot dog is a sandwich."];
const MANY_LONG_TAKES = [
  "If you wear white shoes, keeping them clean is on you, and nobody else should have to look at the mess.",
  "Dirty white sneakers look worse than any other dirty shoe, even muddy hiking boots.",
  "A little scuffing makes white shoes look better because it shows they actually get worn.",
  "I judge people by the state of their shoes, and I think most people secretly do too.",
  "Shoe cleaning kits are a scam; a toothbrush and dish soap work just as well.",
  "Wearing white shoes to a concert is asking for it.",
];

function HotTakesDemo({ initialTakes }: { initialTakes: string[] }) {
  const [takes, setTakes] = useState(initialTakes);
  return (
    <div style={{ width: LIST_WIDTH_PX, height: LIST_HEIGHT_PX }} className="mx-auto flex flex-col">
      <HotTakesList takes={takes} onTakesChange={setTakes} />
    </div>
  );
}

export function HotTakesListStory() {
  return (
    <StoryContainer
      title="Hot Takes list"
      description="Tap a take to edit it in place. The add row stays pinned below the list; Enter or Add appends and keeps focus. A fade shows at the bottom while there's more to scroll."
      variants={[
        { id: "empty", label: "Empty", children: <HotTakesDemo initialTakes={[]} /> },
        { id: "one", label: "One take", children: <HotTakesDemo initialTakes={SHORT_TAKES} /> },
        { id: "many", label: "Six long takes", children: <HotTakesDemo initialTakes={MANY_LONG_TAKES} /> },
      ]}
    />
  );
}
