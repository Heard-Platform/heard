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
      <div className="flex flex-col min-h-[238px]">
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="text-3xl mb-2">💬</div>
          <h3 className="text-2xl text-center">What do you think?</h3>
          <p className="text-base text-center text-muted-foreground max-w-sm">
            Share your take on the topic.
          </p>
          <AddResponseButton onClick={() => setShowModal(true)} />
        </div>

        {isTopCard && (
          <div className="pt-2 mt-4 border-t border-orange-200">
            <p className="text-xs text-center text-orange-700">
              Swipe away to continue
            </p>
          </div>
        )}
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
    </>
  );
}
