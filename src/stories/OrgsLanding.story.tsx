import { useState, ReactNode } from "react";
import { OrgsLanding, Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, SlideWrapper } from "../screens/OrgsLanding";
import { Button } from "../components/ui/button";

interface ShowcaseWrapperProps {
  children: ReactNode;
  onExit: () => void;
}

function ShowcaseWrapper({ children, onExit }: ShowcaseWrapperProps) {
  return (
    <div className="relative h-full w-full">
      {children}
    </div>
  );
}

export function OrgsLandingStory() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const handleExit = () => {
    setActiveDemo(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Orgs Landing Page
        </h2>
        <p className="text-slate-600 mb-4">
          Fullscreen slide-based landing page for organizational users with 7 slides
          explaining Heard as a conversational voting survey platform.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeDemo === "full" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDemo("full")}
          >
            Full Experience
          </Button>
          <Button
            variant={activeDemo === "slide1" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDemo("slide1")}
          >
            Slide 1: What is Heard
          </Button>
          <Button
            variant={activeDemo === "slide2" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDemo("slide2")}
          >
            Slide 2: How it works
          </Button>
          <Button
            variant={activeDemo === "slide3" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDemo("slide3")}
          >
            Slide 3: Benefits
          </Button>
          <Button
            variant={activeDemo === "slide4" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDemo("slide4")}
          >
            Slide 4: Proof points
          </Button>
          <Button
            variant={activeDemo === "slide5" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDemo("slide5")}
          >
            Slide 5: Values
          </Button>
          <Button
            variant={activeDemo === "slide6" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDemo("slide6")}
          >
            Slide 6: Email capture
          </Button>
          <Button
            variant={activeDemo === "slide7" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDemo("slide7")}
          >
            Slide 7: Thank you
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-[800px] relative bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          {activeDemo === "full" && (
            <ShowcaseWrapper onExit={handleExit}>
              <OrgsLanding onExit={handleExit} />
            </ShowcaseWrapper>
          )}
          {activeDemo === "slide1" && (
            <ShowcaseWrapper onExit={handleExit}>
              <Slide1 onNext={() => console.log("Next")} />
            </ShowcaseWrapper>
          )}
          {activeDemo === "slide2" && (
            <ShowcaseWrapper onExit={handleExit}>
              <Slide2 onNext={() => console.log("Next")} />
            </ShowcaseWrapper>
          )}
          {activeDemo === "slide3" && (
            <ShowcaseWrapper onExit={handleExit}>
              <Slide3 onNext={() => console.log("Next")} />
            </ShowcaseWrapper>
          )}
          {activeDemo === "slide4" && (
            <ShowcaseWrapper onExit={handleExit}>
              <Slide4 onNext={() => console.log("Next")} />
            </ShowcaseWrapper>
          )}
          {activeDemo === "slide5" && (
            <ShowcaseWrapper onExit={handleExit}>
              <Slide5 onNext={() => console.log("Next")} />
            </ShowcaseWrapper>
          )}
          {activeDemo === "slide6" && (
            <ShowcaseWrapper onExit={handleExit}>
              <Slide6
                email=""
                submitting={false}
                onEmailChange={(email) => console.log("Email changed:", email)}
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Submit");
                }}
              />
            </ShowcaseWrapper>
          )}
          {activeDemo === "slide7" && (
            <ShowcaseWrapper onExit={handleExit}>
              <Slide7 onExit={handleExit} />
            </ShowcaseWrapper>
          )}
          {!activeDemo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-slate-600">Select a demo above to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}