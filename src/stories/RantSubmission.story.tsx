import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { RantSubmission } from "../components/RantSubmission";

export function RantSubmissionStory() {
  const [activeVariant, setActiveVariant] = useState<"default" | "submitting" | "submitted">("default");
  const [submittedText, setSubmittedText] = useState<string>("");

  const handleSubmit = async (text: string) => {
    console.log("Mock submit:", text);
    setSubmittedText(text);
    setActiveVariant("submitting");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setActiveVariant("submitted");
  };

  return (
    <div className="space-y-4">
      {/* Title + Controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border border-slate-200">
        <h2 className="text-slate-900">Rant Submission</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setActiveVariant("default");
              setSubmittedText("");
            }}
            variant={activeVariant === "default" ? "default" : "outline"}
            size="sm"
          >
            Default
          </Button>
          <Button
            onClick={() => setActiveVariant("submitting")}
            variant={activeVariant === "submitting" ? "default" : "outline"}
            size="sm"
          >
            Submitting
          </Button>
          <Button
            onClick={() => setActiveVariant("submitted")}
            variant={activeVariant === "submitted" ? "default" : "outline"}
            size="sm"
          >
            Submitted
          </Button>
        </div>
      </div>

      {/* Component Preview */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-lg border border-slate-200">
        <div className="max-w-2xl mx-auto">
          <RantSubmission
            onSubmit={handleSubmit}
            isSubmitting={activeVariant === "submitting"}
            hasSubmitted={activeVariant === "submitted"}
            placeholder="What do you think about pineapple on pizza? Let us know your unfiltered thoughts..."
          />
        </div>
      </div>

      {/* Debug info (optional) */}
      {submittedText && (
        <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs">
          <span className="text-slate-400">Last submitted:</span> {submittedText}
        </div>
      )}
    </div>
  );
}
