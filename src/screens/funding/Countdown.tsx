import { useState, useEffect } from "react";
import { C, FUNDING_DEADLINE } from "./constants";

function getTimeLeft() {
  const diff = FUNDING_DEADLINE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function Countdown({ compact = false }: { compact?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (compact) {
    const { days, hours, minutes, seconds } = timeLeft;
    return (
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: C.slate400, fontVariantNumeric: "tabular-nums" } as React.CSSProperties}>
          {" "}
          <strong style={{ color: C.slate600 }}>
            {String(days).padStart(2, "0")}d {String(hours).padStart(2, "0")}h {String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s
          </strong>
          {" "} left to donate
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 384, marginBottom: 32, textAlign: "center" }}>
      <p style={{ color: C.slate500, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 12 }}>
        Time left to donate
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {([
          { value: timeLeft.days, label: "days" },
          { value: timeLeft.hours, label: "hrs" },
          { value: timeLeft.minutes, label: "min" },
          { value: timeLeft.seconds, label: "sec" },
        ] as const).map(({ value, label }, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64 }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: C.slate900, lineHeight: 1, fontVariantNumeric: "tabular-nums" } as React.CSSProperties}>
                {String(value).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 11, color: C.slate400, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                {label}
              </span>
            </div>
            {i < 3 && (
              <span style={{ fontSize: 36, fontWeight: 900, color: C.slate300, marginBottom: 16 }}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function useCountdownDays(): number {
  const [days, setDays] = useState(() => getTimeLeft().days);
  useEffect(() => {
    const id = setInterval(() => setDays(getTimeLeft().days), 60000);
    return () => clearInterval(id);
  }, []);
  return days;
}
