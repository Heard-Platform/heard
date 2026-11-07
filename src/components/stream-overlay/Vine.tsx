import "./stream-overlay.css";

const LEAVES = [
  { centerX: 38, centerY: 80, angle: -30 },
  { centerX: 84, centerY: 200, angle: 25 },
  { centerX: 36, centerY: 400, angle: -25 },
  { centerX: 84, centerY: 540, angle: 30 },
];

export function Vine() {
  return (
    <svg
      className="vine"
      viewBox="0 0 120 720"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="vine-stem"
        d="M60 0 C 46 120, 74 240, 60 360 S 46 560, 60 720"
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {LEAVES.map((leaf) => (
        <ellipse
          key={leaf.centerY}
          className="vine-leaf"
          cx={leaf.centerX}
          cy={leaf.centerY}
          rx="20"
          ry="9"
          transform={`rotate(${leaf.angle} ${leaf.centerX} ${leaf.centerY})`}
        />
      ))}
    </svg>
  );
}
