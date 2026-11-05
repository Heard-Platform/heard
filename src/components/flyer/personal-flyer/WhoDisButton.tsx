import { FounderAvatar } from "./FounderAvatar";
import { COLORS } from "./personal-flyer-theme";

interface WhoDisButtonProps {
  avatarSizePx: number;
  labelClassName: string;
  onClick: () => void;
}

export function WhoDisButton({
  avatarSizePx,
  labelClassName,
  onClick,
}: WhoDisButtonProps) {
  return (
    <button
      className="flex shrink-0 flex-col items-center"
      onClick={onClick}
    >
      <FounderAvatar sizePx={avatarSizePx} />
      <span
        className={`mt-0.5 translate-x-1 ${labelClassName}`}
        style={{ color: COLORS.ink }}
      >
        who dis
      </span>
    </button>
  );
}
