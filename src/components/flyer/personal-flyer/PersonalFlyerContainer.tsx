import { useEffect, useState } from "react";
import type { SwipeSixItem } from "../../../types";
import { api, safelyMakeApiCall } from "../../../utils/api";
import { useDebateSession } from "../../../hooks/useDebateSession";
import { useEmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import type { FlyerCompleteReason } from "../FlyerSwipeContainer";
import type { FlyerScan } from "../flyer-screen/FlyerScanContainer";
import { SwipeSixContainer } from "../../swipe-six/SwipeSixContainer";
import { PersonalScanScreen } from "./PersonalScanScreen";
import { PersonalThanksScreen } from "./PersonalThanksScreen";
import { PersonalWhoDisScreen } from "./PersonalWhoDisScreen";

export const PERSONAL_FLYER_EVENTS = {
  opened: "personal_flyer_screen_opened",
  whoDisOpened: "personal_flyer_screen_who_dis_opened",
  emailAdded: "personal_flyer_screen_email_added",
  keptVoting: "personal_flyer_screen_kept_voting",
};

type Screen = "scan" | "whoDis" | "thanks";

interface PersonalFlyerContainerProps {
  scan: FlyerScan;
  onComplete: (roomId: string, reason: FlyerCompleteReason) => void;
}

export function PersonalFlyerContainer({ scan, onComplete }: PersonalFlyerContainerProps) {
  const { roomId, tally } = scan;
  const { user } = useDebateSession();
  // Read once on arrival so the screen doesn't switch to the signed-in card when a new email is added.
  const [isSignedIn] = useState(() => !!user?.email);
  const [screen, setScreen] = useState<Screen>("scan");
  const [swipeSixItems, setSwipeSixItems] = useState<SwipeSixItem[] | null>(null);
  const [isSwipeSixOpen, setIsSwipeSixOpen] = useState(false);
  const track = (type: string) => api.trackEvent(type, roomId);
  const neighborCount = Math.max(0, tally.agreeCount + tally.disagreeCount - 1);

  const emailFlow = useEmailOtpFlow({
    onComplete: () => {
      track(PERSONAL_FLYER_EVENTS.emailAdded);
      setScreen("thanks");
    },
  });

  useEffect(() => {
    track(PERSONAL_FLYER_EVENTS.opened);
    safelyMakeApiCall(() => api.getRoomSwipeSix(roomId)).then((response) => {
      if (response?.data) setSwipeSixItems(response.data.items);
    });
  }, []);

  useEffect(() => {
    if (isSwipeSixOpen && swipeSixItems?.length === 0)
      onComplete(roomId, "continue");
  }, [isSwipeSixOpen, swipeSixItems]);

  const handleWhoDis = () => {
    track(PERSONAL_FLYER_EVENTS.whoDisOpened);
    setScreen("whoDis");
  };

  const handleKeepVoting = () => {
    track(PERSONAL_FLYER_EVENTS.keptVoting);
    setIsSwipeSixOpen(true);
  };

  const handleExitSwipeSix = () => onComplete(roomId, "continue");

  return (
    <div className="heard-feed-bg h-dvh overflow-y-auto">
      <div className="mx-auto h-full max-w-md">
        {screen === "scan" && (
          <PersonalScanScreen
            vote={scan.vote}
            neighborCount={neighborCount}
            isSignedIn={isSignedIn}
            emailFlow={emailFlow}
            onWhoDis={handleWhoDis}
            onKeepVoting={handleKeepVoting}
          />
        )}
        {screen === "whoDis" && <PersonalWhoDisScreen onBack={() => setScreen("scan")} />}
        {screen === "thanks" && <PersonalThanksScreen onKeepVoting={handleKeepVoting} />}
        {isSwipeSixOpen && !!swipeSixItems?.length && (
          <SwipeSixContainer source="flyer" items={swipeSixItems} onExit={handleExitSwipeSix} />
        )}
      </div>
    </div>
  );
}
