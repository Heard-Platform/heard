import { SwipeHint } from "./SwipeHint";

const sides = [
  {
    side: "left" as const,
    color: "bg-red-500 text-white",
    label: "Swipe left",
    sublabel: "to disagree",
  },
  {
    side: "right" as const,
    color: "bg-green-500 text-white",
    label: "Swipe right",
    sublabel: "to agree",
  },
];

export function SwipeInstructions() {
  return <SwipeHint sides={sides} />;
}
