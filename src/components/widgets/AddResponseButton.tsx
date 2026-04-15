import { MessageCirclePlus } from "lucide-react";
import { Button } from "../ui/button";

export const AddResponseButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="flex">
      <Button
        variant="secondary"
        className="heard-pill"
        onClick={onClick}
      >
        <MessageCirclePlus />
        Add response
      </Button>
    </div>
  );
};
