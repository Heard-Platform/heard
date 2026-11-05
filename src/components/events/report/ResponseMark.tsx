import { MessageCirclePlus } from "lucide-react";

interface ResponseMarkProps {
  className: string;
}

export function ResponseMark({
  className,
}: ResponseMarkProps) {
  return (
    <MessageCirclePlus
      role="img"
      aria-label="Idea from the floor"
      className={className}
    />
  );
}