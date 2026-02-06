import { useState } from "react";
import { Button } from "../components/ui/button";
import { CommunityAdminDialog } from "../components/community/CommunityAdminDialog";
import { StoryContainer } from "./StoryContainer";
import type { SubHeard } from "../types";

export function CommunityAdminDialogStory() {
  const [isOpen, setIsOpen] = useState(false);
  const [mockCommunity, setMockCommunity] = useState<SubHeard>({
    name: "gaming",
    count: 42,
    isPrivate: false,
    adminId: "demo-user-123",
    hostOnlyPosting: false,
  });

  const handleUpdateSubHeard = async (update: SubHeard, userId: string): Promise<boolean> => {
    console.log("Update called:", { update, userId });
    setMockCommunity(prev => ({
      ...prev,
      ...update,
    }));
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  };

  const variants = [
    {
      id: "base",
      label: "Base",
      children:
        <>
          <Button onClick={() => setIsOpen(true)}>
            Open Admin Dialog
          </Button>

          <CommunityAdminDialog
            community={mockCommunity}
            userId="demo-user-123"
            isOpen={isOpen}
            onUpdateSubHeard={handleUpdateSubHeard}
            onClose={() => setIsOpen(false)}
          />
        </>
    },
  ];

  return (
    <StoryContainer
      title="Community Admin Dialog"
      description="Management interface for community admins to control visibility and share links"
      variants={variants}
    />
  );
}