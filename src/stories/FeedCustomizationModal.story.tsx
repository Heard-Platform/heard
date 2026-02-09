import { useState } from "react";
import { FeedCustomizationModal } from "../components/FeedCustomizationModal";
import { Button } from "../components/ui/button";
import { SubHeard } from "../types";

const mockCommunities: SubHeard[] = [
  {
    name: "politics",
    count: 45230,
    adminId: "admin1",
    isPrivate: false,
    hostOnlyPosting: false,
  },
  {
    name: "technology",
    count: 38940,
    adminId: "admin2",
    isPrivate: false,
    hostOnlyPosting: false,
  },
  {
    name: "climate",
    count: 28150,
    adminId: "admin3",
    isPrivate: false,
    hostOnlyPosting: false,
  },
  {
    name: "education",
    count: 22470,
    adminId: "admin4",
    isPrivate: false,
    hostOnlyPosting: false,
  },
  {
    name: "healthcare",
    count: 19830,
    adminId: "admin5",
    isPrivate: false,
    hostOnlyPosting: false,
  },
  {
    name: "economics",
    count: 17650,
    adminId: "admin6",
    isPrivate: false,
    hostOnlyPosting: false,
  },
  {
    name: "sports",
    count: 31290,
    adminId: "admin7",
    isPrivate: false,
    hostOnlyPosting: false,
  },
  {
    name: "entertainment",
    count: 42180,
    adminId: "admin8",
    isPrivate: false,
    hostOnlyPosting: false,
  },
  {
    name: "science",
    count: 24560,
    adminId: "admin9",
    isPrivate: false,
    hostOnlyPosting: false,
  },
  {
    name: "philosophy",
    count: 15320,
    adminId: "admin10",
    isPrivate: false,
    hostOnlyPosting: false,
  },
];

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