import { useState } from "react";
import { FeedCustomizationModal } from "../components/onboarding/FeedCustomizationModal";
import { Button } from "../components/ui/button";
import { mockCommunities } from "./mockData";

export function FeedCustomizationModalStory() {
  const [open, setOpen] = useState(false);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  const handleComplete = (communities: string[]) => {
    setSelectedCommunities(communities);
    console.log("Selected communities:", communities);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Feed Customization Modal
        </h2>
        <p className="text-slate-600 mb-4">
          A modal for first-time users to select communities and customize their feed
        </p>

        <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          Open Modal
        </Button>

        {selectedCommunities.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-slate-900 mb-2">
              Selected Communities:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCommunities.map((community) => (
                <span
                  key={community}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                >
                  #{community}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <FeedCustomizationModal
        open={open}
        communities={mockCommunities}
        onComplete={handleComplete}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}