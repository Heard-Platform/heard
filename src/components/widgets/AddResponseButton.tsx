import { MessageCirclePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("room");
  return (
    <div className="flex">
      <Button
        variant="secondary"
        className="heard-pill"
        disabled={disabled}
        onClick={onClick}
      >
        <MessageCirclePlus />
        {disabled && disabledLabel ? disabledLabel : t("addResponse")}
      </Button>
    </div>
  );
};
