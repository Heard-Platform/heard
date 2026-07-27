import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { StatementSpectrum, SpectrumMode } from "./StatementSpectrum";
import { StatementVotes } from "../../types";

const MODE_DESCRIPTION_KEYS: Record<SpectrumMode, string> = {
  agree: "spectrumDescAgree",
  split: "spectrumDescSplit",
};

const MODE_OPTIONS: Array<{ value: SpectrumMode; labelKey: string }> = [
  { value: "agree", labelKey: "modeAgree" },
  { value: "split", labelKey: "modeSplit" },
];

interface StatementSpectrumCardProps {
  statements: StatementVotes[];
  className?: string;
}

export function StatementSpectrumCard({ statements, className }: StatementSpectrumCardProps) {
  const { t } = useTranslation("analysis");
  const [mode, setMode] = useState<SpectrumMode>("agree");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">{t("statementSpectrum")}</CardTitle>
        <CardDescription className="text-sm">{t(MODE_DESCRIPTION_KEYS[mode])}</CardDescription>
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
              {t(option.labelKey)}
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
