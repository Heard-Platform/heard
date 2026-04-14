import { MessageCirclePlus } from "lucide-react";
import { Button } from "../ui/button";

export const AddResponseButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="flex">
      <Button
        variant="secondary"
        className="rounded-full h-8 px-4 text-sm"
        onClick={onClick}
      >
        <MessageCirclePlus />
        Add response
      </Button>
    </div>
  );
};
