import { useState } from "react";
import { AddResponseModal } from "./AddResponseModal";
import type { DebateRoom } from "../../types";
import { AddResponseButton } from "../widgets/AddResponseButton";

interface ChanceCardProps {
  room: DebateRoom;
  isTopCard: boolean;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
}

export function ChanceCard({
  room,
  isTopCard,
  allowAnonymous,
  isAnonymous,
  onSubmitStatement,
  onShowAccountSetupModal,
}: ChanceCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="heard-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <span className="text-sm text-orange-700">Chance Card!</span>
        </div>
      </div>

      <div className="mb-4 min-h-[120px] flex flex-col items-center justify-center space-y-4">
        <div className="text-3xl mb-2">💬</div>
        <h3 className="text-2xl text-center">What do you think?</h3>
        <p className="text-base text-center text-muted-foreground max-w-sm">
          Share your take on the topic.
        </p>
        <AddResponseButton onClick={() => setShowModal(true)} />
      </div>

      <AddResponseModal
        room={room}
        open={showModal}
        allowAnonymous={allowAnonymous}
        isAnonymous={isAnonymous}
        onOpenChange={setShowModal}
        onSubmitStatement={onSubmitStatement}
        onShowAccountSetupModal={onShowAccountSetupModal}
      />

      {isTopCard && (
        <div className="pt-2 border-t border-orange-200">
          <p className="text-xs text-center text-orange-700">
            Swipe away to continue
          </p>
        </div>
      )}
    </>
  );
}
