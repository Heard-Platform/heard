import { NewStatementInput } from "../NewStatementInput";

interface ChanceCardProps {
  isTopCard: boolean;
  onSubmitStatement: (text: string) => Promise<void>;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  onShowAccountSetupModal: (featureText: string) => void;
}

export function ChanceCard({ 
  isTopCard,
  onSubmitStatement,
  allowAnonymous,
  isAnonymous,
  onShowAccountSetupModal,
}: ChanceCardProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <span className="text-sm text-orange-700">Chance Card!</span>
        </div>
      </div>

      <div className="mb-2 min-h-[120px] flex flex-col items-center justify-center space-y-4">
        <div className="text-3xl mb-2">💬</div>
        <h3 className="text-2xl text-center">What do you think?</h3>
        <p className="text-base text-center text-muted-foreground max-w-sm">
          Use the field below to share your ideas on the topic.
        </p>
      </div>

      <div className="mb-4">
        <NewStatementInput
          onSubmitStatement={onSubmitStatement}
          allowAnonymous={allowAnonymous}
          isAnonymous={isAnonymous}
          onShowAccountSetupModal={onShowAccountSetupModal}
        />
      </div>

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