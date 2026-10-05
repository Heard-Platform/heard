import { TogaMonkey } from "../landing/TogaMonkey";
import { EASING, transitionOf, useAnimationTrigger } from "../landing/landing-motion";
import { FlyerResultsHeader } from "./FlyerResultsHeader";

const TRIGGER_DELAY_MS = 200;

interface FlyerResultsThanksScreenProps {
  areResultsTomorrow: boolean;
  onLookAround: () => void;
}

export function FlyerResultsThanksScreen({ areResultsTomorrow, onLookAround }: FlyerResultsThanksScreenProps) {
  const isTriggered = useAnimationTrigger(TRIGGER_DELAY_MS);

  return (
    <div className="heard-feed-bg flex min-h-dvh flex-col px-5 pb-8 pt-4">
      <FlyerResultsHeader />

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <TogaMonkey
          size={190}
          style={{
            transform: isTriggered ? "translateY(0) scale(1)" : "translateY(30px) scale(0.7)",
            transformOrigin: "bottom center",
            transition: transitionOf("transform", 700, EASING.pop, 0),
          }}
        />
        <div
          className="mt-6"
          style={{
            opacity: isTriggered ? 1 : 0,
            transform: isTriggered ? "translateY(0)" : "translateY(14px)",
            transition: [
              transitionOf("opacity", 400, EASING.ease, 250),
              transitionOf("transform", 500, EASING.bounce, 250),
            ].join(", "),
          }}
        >
          <h1 className="font-serif text-[34px] font-bold leading-tight text-[#1C1B1F]">
            {areResultsTomorrow ? "See you tomorrow at 7" : "See you at 7"}
          </h1>
          <p className="mt-2 text-sm text-[#4A463F]">The results will be in your inbox.</p>
        </div>
      </div>

      <p
        className="text-center text-sm text-[#4A463F]"
        style={{ opacity: isTriggered ? 1 : 0, transition: transitionOf("opacity", 400, EASING.ease, 500) }}
      >
        You're all set. You can close this page.
        <br />
        Got some more time? Feel free to{" "}
        <button className="underline underline-offset-2" onClick={onLookAround}>
          look around
        </button>
        .
      </p>
    </div>
  );
}
