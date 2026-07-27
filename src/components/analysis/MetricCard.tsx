import { useTranslation } from "react-i18next";
import { Card } from "../ui/card";

function scoreLabelKey(score: number) {
  if (score < 0.33) return "scoreLow";
  if (score < 0.66) return "scoreMedium";
  return "scoreHigh";
}

interface MetricCardDotsProps {
  viz: "dots";
  filled: number;
  total: number;
  filledColor?: string;
}

interface MetricCardBarProps {
  viz: "bar";
  score: number;
  count: number;
  barColor?: string;
}

type MetricCardProps = {
  label: string;
  description: string;
} & (MetricCardDotsProps | MetricCardBarProps);

export function MetricCard(props: MetricCardProps) {
  const { t } = useTranslation("analysis");
  const { label, description } = props;

  return (
    <Card className="flex flex-col gap-3 p-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center gap-2 mb-1.5">
        {props.viz === "dots" ? (
          <>
            <div className="flex flex-wrap gap-0.5 flex-1">
              {Array.from({ length: props.total }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i < props.filled ? (props.filledColor ?? "positive-bg") : "bg-muted"}`}
                />
              ))}
            </div>
            <span className="text-xs font-medium tabular-nums">{props.filled}/{props.total}</span>
          </>
        ) : (
          <>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${props.barColor ?? "positive-bg"}`}
                style={{ width: `${props.score * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{t(scoreLabelKey(props.score))}</span>
          </>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </Card>
  );
}
