import type { CSSProperties } from "react";
import { StatementVoterAnimals } from "../components/room/StatementVoterAnimals";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
  padding: 32,
};

const containerStyle: CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 32,
};

const headingStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: "#1e293b",
  marginBottom: 4,
};

const subheadingStyle: CSSProperties = {
  fontSize: 14,
  color: "#64748b",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 24,
};

const variantLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#334155",
  marginBottom: 8,
};

const cardStyle: CSSProperties = {
  position: "relative",
  padding: 24,
  borderRadius: 16,
  border: "2px solid #e2e8f0",
  background: "#ffffff",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
};

const cardTextStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.5,
  textAlign: "center",
  color: "#1e293b",
  minHeight: 90,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardFooterStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
  color: "#94a3b8",
};

function makeVoterIds(count: number, prefix: string): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-voter-${i}`);
}

function MockStatementCard({
  statementId,
  text,
  voterCount,
  voteLabel,
}: {
  statementId: string;
  text: string;
  voterCount: number;
  voteLabel: string;
}) {
  const voterIds = makeVoterIds(voterCount, statementId);

  return (
    <div style={cardStyle}>
      <div style={cardTextStyle}>{text}</div>
      <div style={cardFooterStyle}>
        <span>2 hours ago</span>
        <span>{voteLabel}</span>
      </div>
      <StatementVoterAnimals statementId={statementId} voterIds={voterIds} />
    </div>
  );
}

export function StatementVoterAnimalsStory() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div>
          <div style={headingStyle}>Statement Voter Animals</div>
          <div style={subheadingStyle}>
            Animal avatar heads peeking over the bottom of a statement card
            represent each voter. Watch for a neutral speech bubble to
            randomly pop up above one of them every few seconds.
          </div>
        </div>

        <div style={gridStyle}>
          <div>
            <div style={variantLabelStyle}>No votes yet</div>
            <MockStatementCard
              statementId="story-no-votes"
              text="Remote work should be the default for knowledge workers."
              voterCount={0}
              voteLabel="0 votes"
            />
          </div>

          <div>
            <div style={variantLabelStyle}>A few voters</div>
            <MockStatementCard
              statementId="story-few-votes"
              text="Cities should ban cars from downtown areas."
              voterCount={4}
              voteLabel="4 votes"
            />
          </div>

          <div>
            <div style={variantLabelStyle}>Lots of voters</div>
            <MockStatementCard
              statementId="story-many-votes"
              text="Universal basic income would solve more problems than it creates."
              voterCount={16}
              voteLabel="128 votes"
            />
          </div>

          <div>
            <div style={variantLabelStyle}>Very popular (capped display)</div>
            <MockStatementCard
              statementId="story-very-popular"
              text="Social media has done more harm than good for society."
              voterCount={40}
              voteLabel="1,204 votes"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
