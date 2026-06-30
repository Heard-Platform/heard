import { useState } from "react";
import { C, fmt, PRESET_AMOUNTS } from "./constants";

interface DonateCTAProps {
  nugMode: boolean;
  copied: boolean;
  onDonate: (amount: number) => void;
  onShare: () => void;
}

export function DonateCTA({ nugMode, copied, onDonate, onShare }: DonateCTAProps) {
  const [amount, setAmount] = useState(25);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const handleCustomChange = (raw: string) => {
    setCustomInput(raw);
    const val = parseInt(raw.replace(/\D/g, ""), 10);
    if (val > 0) setAmount(val);
  };

  const isCustomSelected = showCustom || !PRESET_AMOUNTS.includes(amount);

  return (
    <div style={{ width: "100%", maxWidth: 384, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* Preset amount pills */}
      <div style={{ display: "flex", gap: 6, width: "100%" }}>
        {PRESET_AMOUNTS.map((preset) => {
          const selected = !isCustomSelected && amount === preset;
          return (
            <button
              key={preset}
              onClick={() => { setAmount(preset); setShowCustom(false); setCustomInput(""); }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                border: `2px solid ${selected ? C.emerald500 : C.slate200}`,
                cursor: "pointer",
                backgroundColor: selected ? C.emerald50 : "white",
                color: selected ? C.emerald600 : C.slate600,
                transition: "all 0.15s",
              }}
            >
              {fmt(preset, nugMode)}
            </button>
          );
        })}
        <button
          onClick={() => setShowCustom(true)}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            border: `2px solid ${isCustomSelected ? C.emerald500 : C.slate200}`,
            cursor: "pointer",
            backgroundColor: isCustomSelected ? C.emerald50 : "white",
            color: isCustomSelected ? C.emerald600 : C.slate600,
            transition: "all 0.15s",
          }}
        >
          Other
        </button>
      </div>

      {/* Custom amount input */}
      {showCustom && (
        <input
          type="number"
          placeholder="Enter amount"
          value={customInput}
          autoFocus
          onChange={(e) => handleCustomChange(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 16px",
            borderRadius: 10,
            border: `2px solid ${C.slate200}`,
            color: C.slate700,
            fontSize: 16,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      )}

      {/* Donate button */}
      <button
        onClick={() => onDonate(amount)}
        style={{
          width: "100%",
          padding: "18px 0",
          borderRadius: 16,
          background: "linear-gradient(135deg, #059669, #0d9488)",
          color: "white",
          fontWeight: 800,
          fontSize: 22,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px -2px rgba(5,150,105,0.35)",
          marginTop: 2,
        }}
      >
        Give {fmt(amount, nugMode)}
      </button>

      {/* Share CTA */}
      <button
        onClick={onShare}
        style={{ background: "none", border: "none", cursor: "pointer", color: C.slate500, fontSize: 13, textDecoration: "underline", textUnderlineOffset: 2, padding: 0 }}
      >
        {copied ? "Link copied!" : "📣 Share with a friend"}
      </button>
    </div>
  );
}
