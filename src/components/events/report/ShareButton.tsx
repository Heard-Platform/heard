import { toast } from "sonner";
import { Button } from "../../ui/button";

interface ShareButtonProps {
  variant: "default" | "ghost";
  className: string;
}

export function ShareButton({
  variant,
  className,
}: ShareButtonProps) {
  const copyReportLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Report link copied");
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={copyReportLink}
      className={`${className} rounded-full px-5 font-semibold`}
    >
      Share report
    </Button>
  );
}
