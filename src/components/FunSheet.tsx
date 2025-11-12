import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { LucideIcon, Sparkles, ArrowLeft } from "lucide-react";

interface FunSheetTheme {
  bgGradient: string;
  titleGradient: string;
  borderColor: string;
  buttonGradient: string;
  buttonHoverGradient: string;
  shadowColor: string;
  iconColor: string;
  leftIconColor?: string;
  rightIconColor?: string;
}

export const themes = {
  green: {
    bgGradient: "from-green-50 via-emerald-50 to-teal-50",
    titleGradient: "from-emerald-600 to-teal-600",
    borderColor: "border-emerald-100",
    buttonGradient: "from-emerald-500 to-teal-500",
    buttonHoverGradient: "from-emerald-600 to-teal-600",
    shadowColor: "shadow-emerald-200",
    iconColor: "text-emerald-600",
    leftIconColor: "text-emerald-600",
    rightIconColor: "text-teal-600",
  },
  blue: {
    bgGradient: "from-blue-50 via-indigo-50 to-cyan-50",
    titleGradient: "from-blue-600 to-indigo-600",
    borderColor: "border-blue-100",
    buttonGradient: "from-blue-500 to-indigo-500",
    buttonHoverGradient: "from-blue-600 to-indigo-600",
    shadowColor: "shadow-blue-200",
    iconColor: "text-blue-600",
    leftIconColor: "text-blue-600",
    rightIconColor: "text-indigo-600",
  },
  purple: {
    bgGradient: "from-purple-50 via-pink-50 to-fuchsia-50",
    titleGradient: "from-purple-600 to-pink-600",
    borderColor: "border-purple-100",
    buttonGradient: "from-purple-500 to-pink-500",
    buttonHoverGradient: "from-purple-600 to-pink-600",
    shadowColor: "shadow-purple-200",
    iconColor: "text-purple-600",
    leftIconColor: "text-pink-600",
    rightIconColor: "text-purple-600",
  },
} as const;

interface FunSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description: string;
  leftIcon: LucideIcon;
  rightIcon?: LucideIcon; // Made optional
  theme: keyof typeof themes;
  children: ReactNode;
  buttonText: string;
  buttonLoadingText: string;
  buttonIcon: LucideIcon;
  buttonDisabled?: boolean;
  isLoading?: boolean;
  showBackButton?: boolean;
  backButtonText?: string;
  onButtonClick: () => void;
  onBackClick?: () => void;
}

export function FunSheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  theme: themeKey,
  children,
  buttonText,
  buttonLoadingText,
  buttonIcon: ButtonIcon,
  buttonDisabled = false,
  isLoading = false,
  showBackButton = false,
  backButtonText = "Back",
  onButtonClick,
  onBackClick,
}: FunSheetProps) {
  const theme = themes[themeKey];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger !== null && trigger !== undefined && (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      )}
      <SheetContent
        side="bottom"
        className={`h-[90vh] overflow-y-auto rounded-t-3xl bg-gradient-to-br ${theme.bgGradient} border-0 px-5`}
      >
        <SheetHeader className="space-y-2 pt-4">
          <div className="flex items-center justify-center gap-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <LeftIcon className={`w-6 h-6 ${theme.leftIconColor || theme.iconColor}`} />
            </motion.div>
            <SheetTitle className={`text-3xl bg-gradient-to-r ${theme.titleGradient} bg-clip-text text-transparent`}>
              {title}
            </SheetTitle>
          </div>
          <SheetDescription className="text-center text-sm text-slate-600">
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pb-32">
          {children}

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={onButtonClick}
              disabled={buttonDisabled || isLoading}
              className={`w-full h-14 bg-gradient-to-r ${theme.buttonGradient} hover:${theme.buttonHoverGradient} text-white shadow-lg ${theme.shadowColor} disabled:opacity-50 disabled:shadow-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
              size="lg"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  <span className="text-base">{buttonLoadingText}</span>
                </>
              ) : (
                <>
                  <ButtonIcon className="w-5 h-5 mr-2" />
                  <span className="text-base">{buttonText}</span>
                </>
              )}
            </Button>
          </motion.div>

          {/* Back Button */}
          {showBackButton && onBackClick && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={onBackClick}
                className="w-full h-12 flex items-center justify-center gap-2 border-slate-300 hover:border-slate-400 bg-white"
              >
                <ArrowLeft className="w-4 h-4" />
                {backButtonText}
              </Button>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface FunSheetCardProps {
  children: ReactNode;
  delay?: number;
  borderColor?: string;
}

export function FunSheetCard({ children, delay = 0.2, borderColor = "border-emerald-100" }: FunSheetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white p-5 rounded-2xl shadow-sm border ${borderColor}`}
    >
      {children}
    </motion.div>
  );
}