import { useState } from "react";
import { RantSubmission } from "../components/RantSubmission";
import { StoryContainer } from "./StoryContainer";

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

  const handleVariantChange = (variant: "default" | "submitting" | "submitted") => {
    setActiveVariant(variant);
    if (variant === "default") {
      setSubmittedText("");
    }
  };

  return (
    <StoryContainer
      title="Rant Submission"
      variants={[
        { id: "default", label: "Default" },
        { id: "submitting", label: "Submitting" },
        { id: "submitted", label: "Submitted" },
      ]}
      activeVariant={activeVariant}
      onVariantChange={handleVariantChange}
      debugInfo={
        submittedText ? (
          <>
            <span className="text-slate-400">Last submitted:</span> {submittedText}
          </>
        ) : undefined
      }
    >
      <div className="max-w-2xl mx-auto">
        <RantSubmission
          onSubmit={handleSubmit}
          isSubmitting={activeVariant === "submitting"}
          hasSubmitted={activeVariant === "submitted"}
          placeholder="What do you think about pineapple on pizza? Let us know your unfiltered thoughts..."
        />
      </div>
    </StoryContainer>
  );
}
