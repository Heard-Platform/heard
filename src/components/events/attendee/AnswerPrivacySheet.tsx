import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "../../ui/drawer";

const ANSWER_PRIVACY_PROMISES = [
  "Answers only appear as group totals in reports.",
  "Your individual answers are never shared publicly.",
  "We never release personal information such as names, emails or phone numbers.",
];

interface AnswerPrivacySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnswerPrivacySheet({
  isOpen,
  onClose,
}: AnswerPrivacySheetProps) {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <DrawerContent className="rounded-t-3xl border-none">
        <div className="flex flex-col gap-4 px-5 pb-8 pt-5">
          <DrawerTitle className="text-2xl font-extrabold leading-tight tracking-tight text-foreground">
            How your answers are used
          </DrawerTitle>
          <ul className="list-disc space-y-2.5 pl-5 text-base leading-snug secondary-text-strong">
            {ANSWER_PRIVACY_PROMISES.map((promise) => (
              <li key={promise}>{promise}</li>
            ))}
          </ul>
          <p className="text-sm secondary-text-strong">
            More in our{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="heard-link underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
