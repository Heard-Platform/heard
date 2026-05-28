import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { StatementSpectrum, SpectrumMode } from "./StatementSpectrum";
import { StatementVotes } from "../../types";

const MODE_DESCRIPTIONS: Record<SpectrumMode, string> = {
  agree:
    "Every statement plotted from most agreed to most disagreed. Drag across the strip to inspect a range.",
  split:
    "Every statement plotted from strongest consensus to most divided. Drag across the strip to inspect a range.",
};

const MODE_OPTIONS: Array<{ value: SpectrumMode; label: string }> = [
  { value: "agree", label: "Agree / Disagree" },
  { value: "split", label: "Consensus / Split" },
];

interface StatementSpectrumCardProps {
  statements: StatementVotes[];
  className?: string;
}

export function StatementSpectrumCard({ statements, className }: StatementSpectrumCardProps) {
  const [mode, setMode] = useState<SpectrumMode>("agree");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">Statement Spectrum</CardTitle>
        <CardDescription className="text-sm">{MODE_DESCRIPTIONS[mode]}</CardDescription>
        <div className="inline-flex gap-0.5 rounded-md bg-muted p-0.5 text-xs mt-1 w-fit">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              className={`px-2.5 py-1 rounded transition-colors ${
                mode === option.value
                  ? "bg-white text-foreground font-medium shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <StatementSpectrum statements={statements} mode={mode} />
      </CardContent>
    </Card>
  );
}
