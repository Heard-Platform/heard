import { useState } from "react";
import { Button } from "../components/ui/button";
import { CommunityAdminDialog } from "../components/CommunityAdminDialog";
import { StoryContainer } from "./StoryContainer";
import type { SubHeard } from "../types";

export function CommunityAdminDialogStory() {
  const [isOpen, setIsOpen] = useState(false);
  const [mockCommunity, setMockCommunity] = useState<SubHeard>({
    name: "gaming",
    count: 42,
    isPrivate: false,
    adminId: "demo-user-123",
  });

  const handleUpdateSubHeard = async (name: string, userId: string, isPrivate: boolean) => {
    console.log("Update called:", { name, userId, isPrivate });
    setMockCommunity(prev => ({
      ...prev,
      isPrivate,
    }));
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  };

  return (
    <StoryContainer
      title="Community Admin Dialog"
      description="Management interface for community admins to control visibility and share links"
      variants={[{id: "base", label: "Base"}]}
      activeVariant="base"
      onVariantChange={() => {}}
    >
      <Button onClick={() => setIsOpen(true)}>
        Open Admin Dialog
      </Button>

      <CommunityAdminDialog
        community={mockCommunity}
        userId="demo-user-123"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUpdateSubHeard={handleUpdateSubHeard}
      />
    </StoryContainer>
  );
}
