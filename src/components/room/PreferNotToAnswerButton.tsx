interface PreferNotToAnswerButtonProps {
  onClick: () => void;
}

export function PreferNotToAnswerButton({
  onClick,
}: PreferNotToAnswerButtonProps) {
  return (
    <button
      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted underline-offset-2"
      onClick={onClick}
    >
      I prefer not to answer
    </button>
  );
}
