import { useState } from "react";
import { RealTimeResults } from "../components/RealTimeResults";
import { StoryContainer } from "./StoryContainer";
import type { Statement } from "../types";

export function RealTimeResultsStory() {
  const [activeVariant, setActiveVariant] = useState<
    "in-progress" | "few-votes" | "many-votes" | "controversial"
  >("in-progress");

  // Mock statements with few votes
  const mockStatementsFewVotes: Statement[] = [
    {
      id: "stmt-1",
      text: "We should prioritize tomatoes since they're easy to grow and everyone loves them",
      author: "Anonymous",
      agrees: 2,
      disagrees: 1,
      passes: 0,
      superAgrees: 0,
      type: "crux",
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-2",
      text: "Native pollinator plants would benefit the whole neighborhood ecosystem",
      author: "Anonymous",
      agrees: 1,
      disagrees: 0,
      passes: 1,
      superAgrees: 0,
      type: "bridge",
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-3",
      text: "A mix of flowers and vegetables creates the most beautiful and productive garden",
      author: "Anonymous",
      agrees: 3,
      disagrees: 0,
      passes: 0,
      superAgrees: 1,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
  ];

  // Mock statements with many votes - EXCITING!
  const mockStatementsManyVotes: Statement[] = [
    {
      id: "stmt-1",
      text: "Perennial herbs like rosemary and thyme give us fresh flavor year after year with minimal effort",
      author: "Anonymous",
      agrees: 15,
      disagrees: 3,
      passes: 1,
      superAgrees: 5,
      type: "bridge",
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-2",
      text: "Tomatoes should get the most space because they're expensive at the store and easy to grow",
      author: "Anonymous",
      agrees: 12,
      disagrees: 5,
      passes: 2,
      superAgrees: 3,
      type: "crux",
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-3",
      text: "We need sunflowers and zinnias to attract pollinators and make the garden beautiful",
      author: "Anonymous",
      agrees: 8,
      disagrees: 2,
      passes: 3,
      superAgrees: 1,
      type: "plurality",
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-4",
      text: "Native plants require less water and support local wildlife better than exotic vegetables",
      author: "Anonymous",
      agrees: 7,
      disagrees: 4,
      passes: 1,
      superAgrees: 2,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-5",
      text: "We should maximize food production, not waste space on decorative flowers",
      author: "Anonymous",
      agrees: 6,
      disagrees: 8,
      passes: 0,
      superAgrees: 0,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-6",
      text: "Leafy greens like lettuce and kale give us multiple harvests throughout the season",
      author: "Anonymous",
      agrees: 5,
      disagrees: 1,
      passes: 2,
      superAgrees: 0,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-7",
      text: "Kid-friendly plants like strawberries and cherry tomatoes encourage young families to participate",
      author: "Anonymous",
      agrees: 4,
      disagrees: 9,
      passes: 1,
      superAgrees: 0,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-8",
      text: "Hardy root vegetables like potatoes and carrots are more beginner-friendly than delicate herbs",
      author: "Anonymous",
      agrees: 3,
      disagrees: 2,
      passes: 1,
      superAgrees: 0,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
  ];

  // Mock controversial statements - evenly split votes
  const mockStatementsControversial: Statement[] = [
    {
      id: "stmt-1",
      text: "Ornamental flowers vs food crops is the central tension in every community garden",
      author: "Anonymous",
      agrees: 10,
      disagrees: 10,
      passes: 3,
      superAgrees: 2,
      type: "crux",
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-2",
      text: "We should ban non-organic methods completely to protect the soil and pollinators",
      author: "Anonymous",
      agrees: 8,
      disagrees: 9,
      passes: 2,
      superAgrees: 1,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-3",
      text: "Exotic heirloom varieties are more interesting than basic grocery store vegetables",
      author: "Anonymous",
      agrees: 6,
      disagrees: 7,
      passes: 1,
      superAgrees: 0,
      type: "bridge",
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-4",
      text: "Individual plots encourage ownership, but communal beds build community better",
      author: "Anonymous",
      agrees: 5,
      disagrees: 6,
      passes: 4,
      superAgrees: 0,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-5",
      text: "Vertical growing structures maximize space but require more maintenance and expertise",
      author: "Anonymous",
      agrees: 4,
      disagrees: 5,
      passes: 2,
      superAgrees: 1,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
  ];

  // Determine which data to show based on active variant
  const statements =
    activeVariant === "in-progress"
      ? mockStatementsFewVotes
      : activeVariant === "few-votes"
        ? mockStatementsFewVotes
        : activeVariant === "controversial"
          ? mockStatementsControversial
          : mockStatementsManyVotes;

  const mode =
    activeVariant === "in-progress"
      ? "in-progress"
      : "concluded";

  const totalVotes = statements.reduce(
    (sum, s) =>
      sum + s.agrees + s.disagrees + s.passes + s.superAgrees,
    0,
  );

  return (
    <StoryContainer
      title="Real-Time Results"
      variants={[
        { id: "in-progress", label: "⚡ In Progress (LIVE!)" },
        {
          id: "many-votes",
          label: "🎉 Concluded - Many Votes",
        },
        { id: "few-votes", label: "Concluded - Few Votes" },
        { id: "controversial", label: "🌶️ Controversial" },
      ]}
      activeVariant={activeVariant}
      onVariantChange={setActiveVariant}
      debugInfo={
        <>
          <div>
            <span className="text-slate-400">Statements:</span>{" "}
            {statements.length}
          </div>
          <div>
            <span className="text-slate-400">Total votes:</span>{" "}
            {totalVotes}
          </div>
          <div>
            <span className="text-slate-400">
              Top vote count:
            </span>{" "}
            {Math.max(...statements.map((s) => s.agrees), 0)}
          </div>
        </>
      }
    >
      <div className="max-w-4xl mx-auto">
        <RealTimeResults
          debateTitle="Community Garden Planning"
          statements={statements}
          currentSubPhase="results"
          mode={mode}
          onChangeVote={async () => {}}
        />
      </div>
    </StoryContainer>
  );
}