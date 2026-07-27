import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";

interface VoteBreakdownPieProps {
  rawAgree: number;
  superAgree: number;
  disagree: number;
  pass: number;
  size: number;
}

const PIE_DIAMETER = 44;
const RADIUS = PIE_DIAMETER / 2;

const SLICE_ORDER = ["agree", "superAgree", "disagree", "pass", "none"] as const;

const SLICE_FILL_CLASS: Record<(typeof SLICE_ORDER)[number], string> = {
  agree: "agree-fill",
  superAgree: "super-agree-fill",
  disagree: "disagree-fill",
  pass: "pass-fill",
  none: "no-vote-fill",
};

export function VoteBreakdownPie({
  rawAgree,
  superAgree,
  disagree,
  pass,
  size,
}: VoteBreakdownPieProps) {
  const { t } = useTranslation("analysis");
  const voted = rawAgree + superAgree + disagree + pass;
  const didntVote = Math.max(size - voted, 0);

  const pct = (n: number) => (size > 0 ? Math.round((n / size) * 100) : 0);

  const values: Record<(typeof SLICE_ORDER)[number], number> = {
    agree: rawAgree,
    superAgree: superAgree,
    disagree: disagree,
    pass: pass,
    none: didntVote,
  };

  const data = SLICE_ORDER.map((name) => ({ name, value: values[name] }));
  const allZero = data.every((d) => d.value === 0);
  const renderData = allZero ? [{ name: "none", value: 1 }] : data;

  return (
    <div className="flex justify-center min-w-[48px]">
      <PieChart width={PIE_DIAMETER} height={PIE_DIAMETER}>
        <Pie
          data={renderData}
          dataKey="value"
          cx="50%"
          cy="50%"
          outerRadius={RADIUS}
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive={false}
        >
          {renderData.map((d) => (
            <Cell
              key={d.name}
              className={
                SLICE_FILL_CLASS[
                  d.name as (typeof SLICE_ORDER)[number]
                ]
              }
            />
          ))}
        </Pie>
        <Tooltip
          cursor={false}
          allowEscapeViewBox={{ x: true, y: true }}
          wrapperStyle={{ zIndex: 50, outline: "none" }}
          content={({ active }) => {
            if (!active) return null;
            return (
              <div className="bg-popover text-popover-foreground border border-border rounded-md px-2.5 py-1.5 shadow-md text-xs whitespace-nowrap tabular-nums">
                <div className="agree-text">
                  {t("pieAgree", { pct: pct(rawAgree), count: rawAgree })}
                </div>
                <div className="super-agree-text">
                  {t("pieSuperAgree", { pct: pct(superAgree), count: superAgree })}
                </div>
                <div className="disagree-text">
                  {t("pieDisagree", { pct: pct(disagree), count: disagree })}
                </div>
                <div className="pass-text">
                  {t("piePass", { pct: pct(pass), count: pass })}
                </div>
                <div className="text-muted-foreground">
                  {t("pieDidntVote", { pct: pct(didntVote), count: didntVote })}
                </div>
              </div>
            );
          }}
        />
      </PieChart>
    </div>
  );
}
