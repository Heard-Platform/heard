import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Shield, Eye, Lock, DollarSign } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { YOUR_DATA_YOUTUBE_ID } from "../../../utils/constants/links";

interface DataPrivacyModalProps {
  variant: "decision" | "learn more";
  isOpen: boolean;
  onWillingToShare?: () => void;
  onDeclineToShare?: () => void;
  onClose: () => void;
}

interface InfoBlockProps {
  icon: LucideIcon;
  title: string;
  description: string;
  colorScheme: "green" | "blue" | "purple" | "orange";
}

const colorSchemes = {
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "text-green-600",
    title: "text-green-900",
    text: "text-green-800",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    title: "text-blue-900",
    text: "text-blue-800",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "text-purple-600",
    title: "text-purple-900",
    text: "text-purple-800",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "text-orange-600",
    title: "text-orange-900",
    text: "text-orange-800",
  },
};

function InfoBlock({ icon: Icon, title, description, colorScheme }: InfoBlockProps) {
  const colors = colorSchemes[colorScheme];
  
  return (
    <div className={`flex gap-3 p-4 ${colors.bg} border ${colors.border} rounded-lg`}>
      <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
      <div>
        <h4 className={`font-semibold ${colors.title} mb-1`}>{title}</h4>
        <p className={`text-sm ${colors.text}`}>{description}</p>
      </div>
    </div>
  );
}

export function DataPrivacyModal({
  variant,
  isOpen,
  onWillingToShare,
  onDeclineToShare,
  onClose,
}: DataPrivacyModalProps) {
  const handleDecline = () => {
    onDeclineToShare?.();
    onClose();
  };

  const handleAccept = () => {
    onWillingToShare?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <div className="flex flex-col max-h-[90vh] relative">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              Your data on Heard
            </DialogTitle>
            <DialogDescription className="sr-only">
              Information about how we handle your demographic data
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 space-y-6 min-h-0 relative">
            <div className="rounded-lg overflow-hidden border border-border">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${YOUR_DATA_YOUTUBE_ID}`}
                  title="Data Privacy Explanation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Here's how your answers are used and protected when you choose to share them on Heard.
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">How your answers help</h4>
              <p className="text-sm text-purple-800 leading-relaxed">
                When you create a discussion on Heard you can choose to add questions such as age, gender, or neighborhood into the mix. These answers help the community understand which voices are being represented in this discussion. 
                It's valuable context that helps make conversations more meaningful and inclusive.
              </p>
            </div>

            <div className="grid gap-4">
              <InfoBlock
                icon={Eye}
                title="Only shown in aggregate"
                description="Your individual responses are never shown. We only display aggregate statistics like '40% of participants identified as...'"
                colorScheme="green"
              />

              <InfoBlock
                icon={Lock}
                title="Always anonymized"
                description="Your answers are never shared in a way that can link them back to you."
                colorScheme="blue"
              />

              <InfoBlock
                icon={Shield}
                title="You're in control"
                description="Your answers are only used for this specific conversation, and you can edit or delete them at any time."
                colorScheme="purple"
              />

              <InfoBlock
                icon={DollarSign}
                title="We don't sell your data"
                description="Heard does not currently sell any user data and has no immediate plans to do so. If this ever changes, it will only be done in an anonymized way and only on an opt-in basis for existing users, meaning by default your data will not be sold in any manner without your explicit consent."
                colorScheme="orange"
              />
            </div>

            <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none -mx-6" />
          </div>

          <div className="p-6 pt-4 border-t border-border bg-muted/30 space-y-3">
            {variant === "decision" ? (
              <>
                <Button
                  onClick={handleAccept}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  Got it, I'm willing to reconsider
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  I still prefer not to answer
                </Button>
              </>
            ) : (
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}