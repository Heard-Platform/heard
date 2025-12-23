interface MetricsCircleProps {
  participation: number;
  consensus: number;
  spiciness: number;
  reach: number;
  size: number;
}

export function MetricsCircle({
  participation,
  consensus,
  spiciness,
  reach,
  size,
}: MetricsCircleProps) {
  const getRingsLit = (score: number) => {
    if (score >= 0.66) return 3;
    if (score >= 0.33) return 2;
    if (score > 0) return 1;
    return 0;
  };

  const participationRings = getRingsLit(participation);
  const consensusRings = getRingsLit(consensus);
  const spicinessRings = getRingsLit(spiciness);
  const reachRings = getRingsLit(reach);

  const center = size / 2;
  const ringThickness = size * 0.1;
  const rings = [
    { radius: size * 0.2, strokeWidth: ringThickness },
    { radius: size * 0.325, strokeWidth: ringThickness },
    { radius: size * 0.45, strokeWidth: ringThickness },
  ];

  const colors = {
    participation: "#8b5cf6",
    consensus: "#3b82f6",
    spiciness: "#ef4444",
    reach: "#10b981",
  };

  const createQuadrantPath = (
    startAngle: number,
    radius: number,
    strokeWidth: number
  ) => {
    const innerRadius = radius - strokeWidth / 2;
    const outerRadius = radius + strokeWidth / 2;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + 90) * Math.PI) / 180;

    const x1Outer = center + outerRadius * Math.cos(startRad);
    const y1Outer = center + outerRadius * Math.sin(startRad);
    const x2Outer = center + outerRadius * Math.cos(endRad);
    const y2Outer = center + outerRadius * Math.sin(endRad);

    const x1Inner = center + innerRadius * Math.cos(startRad);
    const y1Inner = center + innerRadius * Math.sin(startRad);
    const x2Inner = center + innerRadius * Math.cos(endRad);
    const y2Inner = center + innerRadius * Math.sin(endRad);

    return `
      M ${x1Outer} ${y1Outer}
      A ${outerRadius} ${outerRadius} 0 0 1 ${x2Outer} ${y2Outer}
      L ${x2Inner} ${y2Inner}
      A ${innerRadius} ${innerRadius} 0 0 0 ${x1Inner} ${y1Inner}
      Z
    `;
  };

  const metrics = [
    { name: "participation", ringsLit: participationRings, angle: -90, color: colors.participation },
    { name: "consensus", ringsLit: consensusRings, angle: 0, color: colors.consensus },
    { name: "reach", ringsLit: reachRings, angle: 90, color: colors.reach },
    { name: "spiciness", ringsLit: spicinessRings, angle: 180, color: colors.spiciness },
  ];

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring, ringIndex) => (
          <g key={ringIndex}>
            {metrics.map((metric) => {
              const isLit = ringIndex < metric.ringsLit;
              return (
                <path
                  key={`${metric.name}-${ringIndex}`}
                  d={createQuadrantPath(metric.angle, ring.radius, ring.strokeWidth)}
                  fill={isLit ? metric.color : "#e5e7eb"}
                  opacity={isLit ? 1 : 0.3}
                />
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}