import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "../ui/card";
import { Users } from "lucide-react";

const COLORS = [
  "#7c3aed", // purple
  "#2563eb", // blue
  "#16a34a", // green
  "#d97706", // amber
  "#dc2626", // red
  "#0891b2", // cyan
  "#9333ea", // violet
  "#ea580c", // orange
];

interface DemographicsPieChartsProps {
  demographics: Record<string, { [option: string]: number }>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { count: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: data } = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-sm">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">{data.count} responses ({value.toFixed(1)}%)</p>
    </div>
  );
}

export function DemographicsPieCharts({ demographics }: DemographicsPieChartsProps) {
  const questions = Object.entries(demographics).filter(([, options]) =>
    Object.values(options).some((count) => count > 0)
  );

  if (questions.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center">
          <Users className="w-5 h-5 prefix-icon" />
        </div>
        <div>
          <h2 className="text-xl text-left">Demographic Breakdown</h2>
          <p className="text-sm text-muted-foreground text-left">
            Participant responses to demographic questions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-8">
        {questions.map(([question, options]) => {
          const total = Object.values(options).reduce((sum, n) => sum + n, 0);
          const data = Object.entries(options)
            .map(([label, count]) => ({
              name: label,
              value: total > 0 ? (count / total) * 100 : 0,
              count,
            }))
            .sort((a, b) => b.count - a.count);

          return (
            <div key={question}>
              <h3
                className="text-xs sm:text-sm font-medium mb-3 text-center truncate"
                title={question}
              >
                {question}
              </h3>
              <ResponsiveContainer
                width="100%"
                height={160}
                className="sm:!h-[220px]"
              >
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="45%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-700">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-center text-muted-foreground -mt-2">
                {total} responses
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
