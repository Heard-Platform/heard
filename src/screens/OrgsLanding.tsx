import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { CheckCircle, Linkedin, Instagram, Youtube } from "lucide-react";
import { api, safelyMakeApiCall } from "../utils/api";
import { SOCIAL_LINKS } from "../utils/constants/links";

interface OrgsLandingProps {
  onExit: () => void;
}

const SLIDE_VARIANTS = {
  enter: { x: "100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0 },
};

const SLIDE_TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

interface SlideWrapperProps {
  children: ReactNode;
  hasScroll?: boolean;
}

export function SlideWrapper({ children }: SlideWrapperProps) {
  return (
    <motion.div
      initial="enter"
      animate="center"
      exit="exit"
      variants={SLIDE_VARIANTS}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 pt-20 px-6 overflow-y-auto"
    >
      <div className="min-h-full flex items-center justify-center py-8">
        {children}
      </div>
    </motion.div>
  );
}

interface CTAButtonProps {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  fullWidth?: boolean;
}

function CTAButton({ onClick, children, disabled = false, type = "button", fullWidth = false }: CTAButtonProps) {
  return (
    <Button
      type={type}
      size="lg"
      disabled={disabled}
      className={`bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-full shadow-lg ${fullWidth ? "w-full" : ""}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

interface SlideHeadingProps {
  children: ReactNode;
  size?: "large" | "medium";
}

function SlideHeading({ children, size = "medium" }: SlideHeadingProps) {
  const sizeClasses = size === "large" 
    ? "text-4xl md:text-6xl" 
    : "text-3xl md:text-5xl";
  
  return (
    <h2 className={`${sizeClasses} font-bold text-gray-900 text-center`}>
      {children}
    </h2>
  );
}

interface SlideContentProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

function SlideContent({ children, maxWidth = "lg" }: SlideContentProps) {
  const widthClasses = {
    sm: "max-w-lg",
    md: "max-w-2xl",
    lg: "max-w-3xl",
    xl: "max-w-4xl",
  };
  
  return (
    <div className={`${widthClasses[maxWidth]} w-full space-y-12`}>
      {children}
    </div>
  );
}

interface NumberedStepProps {
  number: number;
  title: string;
  description: string;
}

function NumberedStep({ number, title, description }: NumberedStepProps) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

interface BulletItemProps {
  children: ReactNode;
}

function BulletItem({ children }: BulletItemProps) {
  return (
    <li className="flex gap-3">
      <span className="text-indigo-600 text-xl font-bold mt-0.5">•</span>
      <div>{children}</div>
    </li>
  );
}

export function OrgsLanding({ onExit }: OrgsLandingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalSlides = 7;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
      const response = await safelyMakeApiCall(() => api.submitOrgEmail(email));

      if (response?.success) {
        setSubmitted(true);
        setCurrentSlide(6);
      }
      setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      <div className="h-full flex flex-col">
        <button
          onClick={onExit}
          className="absolute top-6 left-6 z-50 text-2xl font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          aria-label="Return to Heard"
        >
          Heard
        </button>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {currentSlide === 0 && (
              <Slide1 key="slide1" onNext={handleNext} />
            )}
            {currentSlide === 1 && (
              <Slide2 key="slide2" onNext={handleNext} />
            )}
            {currentSlide === 2 && (
              <Slide3 key="slide3" onNext={handleNext} />
            )}
            {currentSlide === 3 && (
              <Slide4 key="slide4" onNext={handleNext} />
            )}
            {currentSlide === 4 && (
              <Slide5 key="slide5" onNext={handleNext} />
            )}
            {currentSlide === 5 && (
              <Slide6
                key="slide6"
                email={email}
                submitting={submitting}
                onEmailChange={setEmail}
                onSubmit={handleSubmit}
              />
            )}
            {currentSlide === 6 && (
              <Slide7
                key="slide7"
                onExit={onExit}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="pb-8 pt-4">
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-indigo-600 w-8"
                    : "bg-indigo-200 hover:bg-indigo-300"
                }`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Slide1({ onNext }: { onNext: () => void }) {
  return (
    <SlideWrapper>
      <SlideContent maxWidth="md">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Heard is a platform for{" "}
            <span className="text-indigo-600">conversational voting surveys</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto">
            Instead of static surveys, Heard lets a community vote, add their own
            responses, and watch a living conversation emerge in real time.
          </p>
          <CTAButton onClick={onNext}>How does it work?</CTAButton>
        </div>
      </SlideContent>
    </SlideWrapper>
  );
}

export function Slide2({ onNext }: { onNext: () => void }) {
  return (
    <SlideWrapper>
      <SlideContent maxWidth="lg">
        <SlideHeading>How it works</SlideHeading>

        <div className="space-y-8">
          <NumberedStep
            number={1}
            title="Create a survey"
            description="You create a survey with a topic and a handful of seed statements to get the conversation started."
          />
          <NumberedStep
            number={2}
            title="Participants vote"
            description="Participants swipe to agree or disagree with each statement."
          />
          <NumberedStep
            number={3}
            title="Real-time engagement"
            description="Participants can add their own statements for others to vote on, and watch results update in real time."
          />
        </div>

        <div className="flex justify-center pt-8">
          <CTAButton onClick={onNext}>Why this is better</CTAButton>
        </div>
      </SlideContent>
    </SlideWrapper>
  );
}

export function Slide3({ onNext }: { onNext: () => void }) {
  return (
    <SlideWrapper>
      <SlideContent maxWidth="lg">
        <div className="space-y-6 text-center">
          <SlideHeading>Why Heard is better than traditional surveys</SlideHeading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Heard makes collecting feedback easier, faster, and more engaging for everyone involved.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm p-6 border-2 border-indigo-200 max-w-2xl mx-auto">
          <ul className="space-y-5 text-left">
            <BulletItem>
              <span className="font-semibold text-gray-900">Less upfront work for you</span>
              <span className="text-gray-700"> — just seed the conversation with a topic and a few starter statements, then let participants add their own responses</span>
            </BulletItem>
            <BulletItem>
              <span className="font-semibold text-gray-900">Higher response rates</span>
              <span className="text-gray-700"> — people feel ownership over the conversation and come back to see how their statements are performing</span>
            </BulletItem>
            <BulletItem>
              <span className="font-semibold text-gray-900">No expensive marketing campaigns needed</span>
              <span className="text-gray-700"> — there's already an engaged pool of people on the platform ready to participate</span>
            </BulletItem>
          </ul>
        </div>

        <div className="flex justify-center pt-6">
          <CTAButton onClick={onNext}>What makes us different?</CTAButton>
        </div>
      </SlideContent>
    </SlideWrapper>
  );
}

export function Slide4({ onNext }: { onNext: () => void }) {
  return (
    <SlideWrapper>
      <SlideContent maxWidth="lg">
        <div className="space-y-6 text-center">
          <SlideHeading>How we know this works</SlideHeading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tools like these have already been used by governments and civic bodies to gather input from millions of people.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm p-6 border-2 border-indigo-200 max-w-2xl mx-auto">
          <ul className="space-y-5 text-left">
            <BulletItem>
              <span className="font-semibold text-gray-900">
                <a
                  href="https://info.vtaiwan.tw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300"
                >
                  vTaiwan
                </a>
              </span>
              <span className="text-gray-700"> — used by the Taiwanese government to crowdsource policy on ride-sharing and other issues, with millions of participants</span>
            </BulletItem>
            <BulletItem>
              <span className="font-semibold text-gray-900">
                <a
                  href="https://www.opengovpartnership.org/brazil-digital-governance-story/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300"
                >
                  Decidim / Participativo
                </a>
              </span>
              <span className="text-gray-700"> — large-scale participatory platforms used across Latin America and Europe to engage citizens in policy-making processes</span>
            </BulletItem>
            <BulletItem>
              <span className="font-semibold text-gray-900">
                <a
                  href="https://whatcouldbgbe.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300"
                >
                  Bowling Green, Kentucky
                </a>
              </span>
              <span className="text-gray-700"> — a domestic US example of a local government using this approach to meaningfully engage residents in community decisions</span>
            </BulletItem>
          </ul>
        </div>

        <div className="flex justify-center pt-6">
          <CTAButton onClick={onNext}>Why we built Heard</CTAButton>
        </div>
      </SlideContent>
    </SlideWrapper>
  );
}

export function Slide5({ onNext }: { onNext: () => void }) {
  return (
    <SlideWrapper>
      <SlideContent maxWidth="lg">
        <div className="space-y-6 text-center">
          <SlideHeading>Built with a purpose</SlideHeading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Heard is more than just a tool, it's a commitment to strengthening democratic engagement and civic participation.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm p-6 border-2 border-indigo-200 max-w-2xl mx-auto">
          <ul className="space-y-5 text-left">
            <BulletItem>
              <span className="font-semibold text-gray-900">Public Benefit Corporation</span>
              <span className="text-gray-700"> — legally structured to prioritize public benefit alongside profit</span>
            </BulletItem>
            <BulletItem>
              <span className="font-semibold text-gray-900">Committed to Open Source</span>
              <span className="text-gray-700"> — working toward transparency and community ownership</span>
            </BulletItem>
            <BulletItem>
              <span className="font-semibold text-gray-900">Pro-Democracy by Design</span>
              <span className="text-gray-700"> — built to amplify voices and foster productive dialogue</span>
            </BulletItem>
            <BulletItem>
              <span className="font-semibold text-gray-900">Founded by{" "}
                <a 
                  href={SOCIAL_LINKS.LINKEDIN}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300"
                >
                  a local DC resident
                </a>
              </span>
              <span className="text-gray-700"> — with a background in civic tech and impact-focused startups</span>
            </BulletItem>
          </ul>
        </div>

        <div className="flex justify-center pt-6">
          <CTAButton onClick={onNext}>Running a pilot program</CTAButton>
        </div>
      </SlideContent>
    </SlideWrapper>
  );
}

interface Slide6Props {
  email: string;
  submitting: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function Slide6({
  email,
  submitting,
  onEmailChange,
  onSubmit,
}: Slide6Props) {
  return (
    <SlideWrapper>
      <SlideContent maxWidth="sm">
        <div className="text-center space-y-8">
          <SlideHeading>Start a pilot program</SlideHeading>
          <p className="text-lg text-gray-600">
            We are running pilot programs for organizations to see how Heard can work for your community.
            Share your email and we'll reach out to learn more about your needs.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              placeholder="your@email.com"
              className="h-14 text-lg px-6 rounded-full border-2 border-indigo-200 focus:border-indigo-600"
              required
              onChange={(e) => onEmailChange(e.target.value)}
            />
            <CTAButton
              type="submit"
              onClick={() => {}}
              disabled={submitting || !email.trim()}
              fullWidth
            >
              {submitting ? "Submitting..." : "Submit"}
            </CTAButton>
          </form>
        </div>
      </SlideContent>
    </SlideWrapper>
  );
}

interface Slide7Props {
  onExit: () => void;
}

export function Slide7({ onExit }: Slide7Props) {
  const socials = [
    { href: SOCIAL_LINKS.LINKEDIN, Icon: Linkedin, label: "LinkedIn" },
    { href: SOCIAL_LINKS.INSTAGRAM, Icon: Instagram, label: "Instagram" },
    { href: SOCIAL_LINKS.YOUTUBE, Icon: Youtube, label: "YouTube" },
  ];

  return (
    <SlideWrapper>
      <SlideContent maxWidth="sm">
        <div className="text-center space-y-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <SlideHeading size="medium">
            Thanks for signing up for the pilot program!
          </SlideHeading>
          <p className="text-lg text-gray-600">
            We'll reach out soon to get you started. In the meantime, feel free to explore Heard and see what the community is talking about.
          </p>

          <CTAButton onClick={onExit}>Start exploring Heard</CTAButton>
          
          <div className="flex justify-center gap-3">
            {socials.map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-colors"
                aria-label={label}
              >
                <Icon className="w-5 h-5 text-indigo-600" />
              </a>
            ))}
          </div>
        </div>
      </SlideContent>
    </SlideWrapper>
  );
}