import { useEffect, useRef, useState, type RefObject } from "react";
import { Linkedin, Instagram, Youtube, type LucideIcon } from "lucide-react";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { RoomAnalysisEmbed } from "../components/analysis/RoomAnalysisEmbed";
import { SwipeTutorialProvider } from "../contexts/SwipeTutorialContext";
import { Toaster } from "../components/ui/sonner";
import { api } from "../utils/api";
import { SOCIAL_LINKS, CALENDLY_PILOT_URL } from "../utils/constants/links";
import type { DebateRoom, Statement, VoteType } from "../types";
import alexAvatar from "../assets/profile.jpeg";

const FEATURED_ROOM_ID = "s6r23ralcomq8l9p6p";

const COLORS = {
  indigo50: "#eef2ff",
  indigo100: "#e0e7ff",
  indigo300: "#a5b4fc",
  indigo600: "#4f46e5",
  indigo700: "#4338ca",
  indigo800: "#3730a3",
  purple50: "#faf5ff",
  gray900: "#111827",
  gray700: "#374151",
  gray600: "#4b5563",
  gray500: "#6b7280",
  white: "#ffffff",
};

const DEMO_ROOM: DebateRoom = {
  id: "organizers-demo-room",
  topic: "Organizers demo",
  phase: "round1",
  gameNumber: 1,
  roundStartTime: Date.now(),
  participants: [],
  hostId: "organizers-demo-host",
  isActive: true,
  createdAt: Date.now(),
  mode: "realtime",
  allowAnonymous: true,
  demographicQuestions: [],
};

const DEMO_STATEMENTS: Statement[] = [
  {
    id: "organizers-demo-1",
    text: "Every meeting should have a 10-minute snack break, no exceptions.",
    author: "demo",
    agrees: 61,
    disagrees: 14,
    passes: 4,
    superAgrees: 21,
    roomId: DEMO_ROOM.id,
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "organizers-demo-2",
    text: "Reply-all emails must be tweet-length or shorter",
    author: "demo",
    agrees: 58,
    disagrees: 22,
    passes: 6,
    superAgrees: 33,
    roomId: DEMO_ROOM.id,
    timestamp: Date.now(),
    round: 1,
    voters: {},
    isSpicy: true,
  },
  {
    id: "organizers-demo-3",
    text: "Our holiday party needs an ugly sweater contest.",
    author: "demo",
    agrees: 47,
    disagrees: 19,
    passes: 9,
    superAgrees: 26,
    roomId: DEMO_ROOM.id,
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "organizers-demo-4",
    text: "If you cancel an event within 24 hours of it, you owe us donuts.",
    author: "demo",
    agrees: 52,
    disagrees: 17,
    passes: 5,
    superAgrees: 29,
    roomId: DEMO_ROOM.id,
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
];

const SOCIAL_BUTTONS: Array<{ href: string; Icon: LucideIcon; label: string }> = [
  { href: SOCIAL_LINKS.LINKEDIN, Icon: Linkedin, label: "LinkedIn" },
  { href: SOCIAL_LINKS.INSTAGRAM, Icon: Instagram, label: "Instagram" },
  { href: SOCIAL_LINKS.YOUTUBE, Icon: Youtube, label: "YouTube" },
];

interface Testimonial {
  id: string;
  emoji: string;
  org: string;
  tag: string;
  body: string;
  link?: { text: string; url: string };
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "dupont_circle_anc",
    emoji: "🏘️",
    org: "Dupont Circle ANC",
    tag: "Neighborhood commission",
    body: "Dupont residents have weighed in on everything from unleashed dogs, to rats, to building height limits. Results presented at monthly neighborhood meetings.",
  },
  {
    id: "beagle_freedom_project",
    emoji: "🐾",
    org: "Wisconsin Animal Rescue",
    tag: "Nonprofit",
    body: "The Beagle Freedom Project used Heard to run a debrief with volunteers after the action revealing critical findings on training.",
    link: { text: "The Beagle Freedom Project", url: "https://bfp.org/" },
  },
  {
    id: "interdependance_day",
    emoji: "🎆",
    org: "InterdepenDance Day conference",
    tag: "Event & conference",
    body: "The conference ran a live in-person Heard session using a projector screen where attendees helped envision the future of American democracy.",
    link: { text: "The conference", url: "https://interdependanceday.org/" },
  },
];

interface OrganizersLandingProps {
  onExit: () => void;
}

export function OrganizersLanding({ onExit }: OrganizersLandingProps) {
  const belowFoldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.trackEvent("organizers_page_view");
  }, []);

  useEffect(() => {
    const el = belowFoldRef.current;
    if (!el) return;

    let fired = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!fired && !entry.isIntersecting && entry.boundingClientRect.top < 0) {
        fired = true;
        api.trackEvent("organizers_scrolled_below_fold");
        observer.disconnect();
      }
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const handleExit = () => {
    api.trackEvent("organizers_click_exit_logo");
    onExit();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(to bottom right, ${COLORS.indigo50}, ${COLORS.white}, ${COLORS.purple50})`,
      }}
    >
      <header style={{ padding: "20px 24px" }}>
        <button
          onClick={handleExit}
          aria-label="Return to Heard"
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: COLORS.indigo600,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.indigo800)}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.indigo600)}
        >
          Heard
        </button>
      </header>

      <main
        style={{
          padding: "0 24px 80px",
          maxWidth: "672px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "64px",
        }}
      >
        <HeroSection sentinelRef={belowFoldRef} />
        <DemoSection />
        <PrimaryCtaSection />
        <AboutSection />
        <TestimonialsSection />
        <InspiredBySection />
        <ClosingCtaSection />
      </main>

      <Toaster />
    </div>
  );
}

function HeroSection({ sentinelRef }: { sentinelRef: RefObject<HTMLDivElement | null> }) {
  return (
    <section
      ref={sentinelRef}
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        paddingTop: "16px",
      }}
    >
      <p
        style={{
          color: COLORS.indigo600,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.025em",
          fontSize: "0.875rem",
        }}
      >
        For organizers, unions, and civic groups
      </p>
      <h1
        style={{
          fontSize: "clamp(1.875rem, 5vw, 2.25rem)",
          fontWeight: 700,
          color: COLORS.gray900,
          lineHeight: 1.25,
        }}
      >
        Give your community real ownership, and stop carrying all the
        organizing weight yourself.
      </h1>
      <p style={{ fontSize: "1.125rem", color: COLORS.gray600 }}>
        Structured conversations that help your members surface what they
        care about, brainstorm ideas, and vote on decisions, at scale.
      </p>
    </section>
  );
}

function DemoSection() {
  const [votesCast, setVotesCast] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (votesCast >= DEMO_STATEMENTS.length) {
      api.trackEvent("organizers_demo_completed");
      const timer = setTimeout(() => setShowCompletion(true), 400);
      return () => clearTimeout(timer);
    }
  }, [votesCast]);

  const handleVote = async (_id: string, voteType: VoteType) => {
    api.trackEvent(`organizers_demo_vote_${voteType}`);
    setVotesCast((n) => n + 1);
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: COLORS.gray900,
          textAlign: "center",
        }}
      >
        Try it yourself
      </h2>
      <SwipeTutorialProvider>
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
          {showCompletion ? (
            <div
              style={{
                maxWidth: "384px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "48px 0",
              }}
            >
              <p style={{ fontSize: "1.875rem" }}>🎉</p>
              <p style={{ fontSize: "1.125rem", fontWeight: 600, color: COLORS.gray900 }}>
                That's it. That's the whole interface.
              </p>
              <p style={{ color: COLORS.gray600 }}>
                Real conversations work exactly the same way, just with your
                members' own statements.
              </p>
            </div>
          ) : (
            <SwipeableStatementStack
              room={DEMO_ROOM}
              statements={DEMO_STATEMENTS}
              currentUserId="organizers-demo-user"
              allowAnonymous={true}
              isAnonymous={false}
              chanceCardSwiped={true}
              cover={null}
              coverCardSwiped={true}
              shareCardSwiped={true}
              demographicQuestions={[]}
              answeredQuestionIds={new Set()}
              isActive={true}
              onVote={handleVote}
              onSubmitStatement={async () => {}}
              onShowAccountSetupModal={() => {}}
              onChanceCardSwiped={async () => {}}
              onCoverCardSwiped={async () => {}}
              onShareCardSwiped={async () => {}}
              onCertifyDone={async () => {}}
              onDemographicsAnswered={async () => {}}
            />
          )}
        </div>
      </SwipeTutorialProvider>
      <p
        style={{
          textAlign: "center",
          fontSize: "0.875rem",
          color: COLORS.gray500,
          maxWidth: "384px",
          margin: "0 auto",
        }}
      >
        Swipe-based and mobile-friendly. Works in your browser on any phone, tablet, or computer,
        no downloads. Shared with a single link.
      </p>
    </section>
  );
}

function PrimaryCtaButton({ location }: { location: "top" | "bottom" }) {
  return (
    <>
      <a
        href={CALENDLY_PILOT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => api.trackEvent(`organizers_click_schedule_${location}`)}
        style={{
          display: "inline-block",
          backgroundColor: COLORS.indigo600,
          color: COLORS.white,
          padding: "16px 32px",
          fontSize: "1.125rem",
          fontWeight: 600,
          borderRadius: "9999px",
          boxShadow:
            "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
          textDecoration: "none",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.indigo700)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.indigo600)}
      >
        See a free pilot &rarr; Book 15 minutes
      </a>
      <p style={{ color: COLORS.gray600 }}>
        Free for nonprofits, unions, and civic groups.
      </p>
    </>
  );
}

function PrimaryCtaSection() {
  return (
    <section
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "16px 0",
      }}
    >
      <PrimaryCtaButton location="top" />
      <RoomAnalysisEmbed
        roomId={FEATURED_ROOM_ID}
        triggerLabel="See results from a real DC conversation on Waymo"
      />
    </section>
  );
}

function ClosingCtaSection() {
  return (
    <section
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "16px 0",
      }}
    >
      <SectionHeading>I'd love to give you a demo</SectionHeading>
      <PrimaryCtaButton location="bottom" />
    </section>
  );
}

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p
      style={{
        color: COLORS.indigo600,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.025em",
        fontSize: "0.875rem",
        textAlign: "center",
      }}
    >
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2
      style={{
        fontSize: "1.5rem",
        fontWeight: 700,
        color: COLORS.gray900,
        textAlign: "center",
      }}
    >
      {children}
    </h2>
  );
}

const cardStyle = {
  backgroundColor: COLORS.white,
  borderRadius: "20px",
  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.08)",
};

function AboutSection() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionEyebrow>The founder</SectionEyebrow>
      <SectionHeading>Built by a DC local</SectionHeading>

      <div
        style={{
          ...cardStyle,
          padding: "32px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <img
          src={alexAvatar}
          alt="Alex Long"
          style={{
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            boxShadow: `0 0 0 4px ${COLORS.indigo50}`,
          }}
        />

        <div
          style={{
            flex: "1 1 240px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            textAlign: "left",
          }}
        >
          <p style={{ color: COLORS.gray700, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: COLORS.gray900 }}>
              Alex Long
            </span>{" "}
            is a DC-based software engineer and civic tech founder, building
            Heard to help his own neighborhood organize better.
          </p>

          <div style={{ display: "flex", gap: "10px" }}>
            {SOCIAL_BUTTONS.map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                onClick={() => api.trackEvent(`organizers_click_founder_${label.toLowerCase()}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  borderRadius: "9999px",
                  backgroundColor: COLORS.indigo50,
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.indigo100)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.indigo50)}
              >
                <Icon style={{ width: "18px", height: "18px", color: COLORS.indigo600 }} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function renderTestimonialBody(testimonial: Testimonial) {
  if (!testimonial.link) return testimonial.body;

  const { text, url } = testimonial.link;
  const startIndex = testimonial.body.indexOf(text);
  if (startIndex === -1) return testimonial.body;

  const before = testimonial.body.slice(0, startIndex);
  const after = testimonial.body.slice(startIndex + text.length);

  return (
    <>
      {before}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => api.trackEvent(`organizers_click_testimonial_${testimonial.id}`)}
        style={{
          fontWeight: 600,
          color: COLORS.gray900,
          textDecoration: "underline",
          textDecorationColor: COLORS.indigo300,
        }}
      >
        {text}
      </a>
      {after}
    </>
  );
}

function TestimonialsSection() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>
      <SectionEyebrow>Who's using Heard</SectionEyebrow>
      <SectionHeading>Real communities, real conversations</SectionHeading>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {TESTIMONIALS.map((testimonial) => (
          <div
            key={testimonial.id}
            style={{
              ...cardStyle,
              flex: "1 1 220px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "1.875rem" }}>{testimonial.emoji}</span>
            <p style={{ fontWeight: 700, color: COLORS.gray900 }}>{testimonial.org}</p>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: COLORS.indigo600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {testimonial.tag}
            </p>
            <p style={{ color: COLORS.gray600, fontSize: "0.9375rem", lineHeight: 1.5 }}>
              {renderTestimonialBody(testimonial)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InspiredBySection() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>
      <SectionEyebrow>Based on a true story</SectionEyebrow>
      <SectionHeading>Taiwan proved the model</SectionHeading>

      <div
        style={{
          ...cardStyle,
          padding: "32px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "32px",
        }}
      >
        <div style={{ flex: "1 1 140px", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem", fontWeight: 800, color: COLORS.indigo600, lineHeight: 1 }}>
            40,000+
          </p>
          <p style={{ fontSize: "0.875rem", color: COLORS.gray500, marginTop: "4px" }}>
            votes cast
          </p>
        </div>

        <div style={{ flex: "2 1 280px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
          <p style={{ color: COLORS.gray700, lineHeight: 1.6 }}>
            Heard is inspired by{" "}
            <a
              href="https://compdemocracy.org/case-studies/2014-vtaiwan/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => api.trackEvent("organizers_click_vtaiwan_link")}
              style={{
                fontWeight: 600,
                color: COLORS.gray900,
                textDecoration: "underline",
                textDecorationColor: COLORS.indigo300,
              }}
            >
              vTaiwan
            </a>
            , the open-source consensus process Taiwan used in 2015 to let
            thousands of citizens weigh in on how to regulate Uber.
          </p>
          <p style={{ color: COLORS.gray600, fontSize: "0.9375rem", lineHeight: 1.6 }}>
            Drivers, riders, and taxi companies cast tens of thousands of
            votes using the same tech that Heard is inspired by, and real common ground
            emerged. The government wrote that consensus into the country's
            actual ride-hailing regulations.
          </p>
        </div>
      </div>
    </section>
  );
}
