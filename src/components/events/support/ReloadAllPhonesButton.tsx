import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../ui/alert-dialog";
import { Button } from "../../ui/button";

interface ReloadAllPhonesButtonProps {
  isReloadingPhones: boolean;
  onReloadAllPhones: () => void;
}

export function ReloadAllPhonesButton({ isReloadingPhones, onReloadAllPhones }: ReloadAllPhonesButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2" disabled={isReloadingPhones}>
          <RotateCcw className="h-4 w-4" />
          {isReloadingPhones ? "Reloading phones…" : "Reload all phones"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reload every phone?</AlertDialogTitle>
          <AlertDialogDescription>
            For after a hotfix deploy. Every phone reloads and lands back on the current post.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onReloadAllPhones}>Reload all phones</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
