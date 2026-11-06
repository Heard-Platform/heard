import type { VoteType } from "../types";
import type { FlyerScan } from "../components/flyer/flyer-screen/FlyerScanContainer";
import { useDebateSession } from "./useDebateSession";
import {
  FeatureFlags,
  isFeatureEnabled,
} from "../utils/constants/feature-flags";
import { WAYMO_DC_ROOM_ID } from "../utils/constants/flyers";
import { isFlyerVote } from "../utils/votes";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface FlyerScanData {
  flyerId: string;
  statementId: string;
  vote: VoteType;
  flyerGroup?: number;
}

interface UseQuickVoteViaFlyerOptions {
  startRoomJoin: (roomId: string) => void;
  setNewFlyerScan: (flyerScan: FlyerScan) => void;
}

export function useQuickVoteViaFlyer({
  startRoomJoin,
  setNewFlyerScan,
}: UseQuickVoteViaFlyerOptions) {
  const { quickVoteViaFlyer } = useDebateSession();

  const shouldQuickVoteViaFlyer = (flyerData: FlyerScanData) =>
    isFeatureEnabled(FeatureFlags.QUICK_FLYER_VOTE) &&
    flyerData.flyerId === WAYMO_DC_ROOM_ID &&
    flyerData.vote !== "pass";

  const quickJoinViaFlyer = async (flyerData: FlyerScanData) => {
    const { vote } = flyerData;
    if (!isFlyerVote(vote)) {
      toast.error("Failed to process flyer vote");
      return;
    }

    const response = await quickVoteViaFlyer(
      flyerData.flyerId,
      flyerData.statementId,
      flyerData.vote,
      flyerData.flyerGroup,
    );

    if (!response) {
      toast.error("Failed to process flyer vote");
      return;
    }

    startRoomJoin(response.roomId);
    setNewFlyerScan({
      roomId: response.roomId,
      tally: {
        statementText: response.statementText,
        agreeCount: response.agreeCount,
        disagreeCount: response.disagreeCount,
      },
      vote,
    });
  };

  return { shouldQuickVoteViaFlyer, quickJoinViaFlyer };
}
