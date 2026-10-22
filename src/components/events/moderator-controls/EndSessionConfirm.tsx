import { Button } from "../../ui/button";

interface EndSessionConfirmProps {
  isBusy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EndSessionConfirm({ isBusy, onConfirm, onCancel }: EndSessionConfirmProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-end bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="end-session-title">
      <div className="w-full heard-card-bg rounded-2xl p-5 space-y-3 text-center shadow-xl">
        <h3 id="end-session-title" className="text-xl font-bold text-foreground">End for everyone?</h3>
        <p className="text-sm text-muted-foreground">Phones show the thank-you screen.</p>
        <Button variant="destructive" className="w-full h-11" disabled={isBusy} onClick={onConfirm}>
          End session
        </Button>
        <Button variant="ghost" className="w-full h-11" disabled={isBusy} onClick={onCancel}>
          Keep going
        </Button>
      </div>
    </div>
  );
}
