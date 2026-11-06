import { toast } from "sonner";

interface ShareButtonProps {
  className: string;
}

export function ShareButton({ className }: ShareButtonProps) {
  const copyReportLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Report link copied");
  };

  return (
    <button
      type="button"
      onClick={copyReportLink}
      className={`${className} rounded-full px-5 text-sm font-semibold`}
    >
      Share report
    </button>
  );
}