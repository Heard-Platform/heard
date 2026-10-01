import { RaindownConfetti2 } from "../../../RaindownConfetti2";
import { FlyerLandingHeader } from "./FlyerLandingHeader";
import { LookAroundLink } from "./LookAroundLink";
import { TogaMonkey } from "./TogaMonkey";
import { EASING, transitionOf, useAnimationTrigger } from "./landing-motion";

const TRIGGER_DELAY_MS = 200;

interface FlyerThanksScreenProps {
  community: string | null;
  isReturningUser: boolean;
  onLookAround: () => void;
}

export function FlyerThanksScreen({ community, isReturningUser, onLookAround }: FlyerThanksScreenProps) {
  const isTriggered = useAnimationTrigger(TRIGGER_DELAY_MS);

  return (
    <div className="heard-feed-bg relative flex min-h-full flex-col px-5 pb-6 pt-4">
      <RaindownConfetti2 triggerDelayMs={TRIGGER_DELAY_MS} />
      <FlyerLandingHeader community={community} />

      <div className="mt-4 flex flex-col items-center text-center">
        <TogaMonkey
          size={200}
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
          <h1 className="text-[34px] font-extrabold leading-tight tracking-tight text-[#1C1B1F]">
            Thank you, citizen.
          </h1>
          <p className="mx-auto mt-2 max-w-72 text-base text-[#4A463F]">
            {isReturningUser
              ? "Your voice is on the record. Good to have you back."
              : "Your voice is on the record. Check your inbox for a welcome note from us."}
          </p>
        </div>

        <div className="mt-10">
          <LookAroundLink
            style={{
              opacity: isTriggered ? 1 : 0,
              transition: transitionOf("opacity", 400, EASING.ease, 500),
            }}
            onClick={onLookAround}
          />
        </div>
      </div>
    </div>
  );
}
