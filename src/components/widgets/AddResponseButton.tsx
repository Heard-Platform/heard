import { MessageCirclePlus } from "lucide-react";
import { Button } from "../ui/button";

export const AddResponseButton = ({
  disabled,
  disabledLabel,
  onClick,
}: {
  disabled?: boolean;
  disabledLabel?: string;
  onClick: () => void;
}) => {
  return (
    <div className="flex">
      <Button
        variant="secondary"
        className="heard-pill"
        disabled={disabled}
        onClick={onClick}
      >
        <MessageCirclePlus />
        {disabled && disabledLabel ? disabledLabel : "Add response"}
      </Button>
    </div>
  );
};
