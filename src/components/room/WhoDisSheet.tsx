import { Drawer, DrawerContent, DrawerTitle } from "../ui/drawer";
import { PersonalWhoDisScreen } from "../flyer/personal-flyer/PersonalWhoDisScreen";
import { FOUNDER_NAME } from "../flyer/personal-flyer/personal-flyer-theme";

interface WhoDisSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhoDisSheet({ isOpen, onClose }: WhoDisSheetProps) {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <DrawerContent className="heard-feed-bg max-h-[92dvh] rounded-t-3xl border-none">
        <DrawerTitle className="sr-only">
          About {FOUNDER_NAME}
        </DrawerTitle>
        <div className="overflow-y-auto">
          <PersonalWhoDisScreen onBack={onClose} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
