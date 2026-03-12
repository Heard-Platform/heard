import { Sankey, Tooltip, ResponsiveContainer, Layer, Rectangle } from "recharts";
import type { FunnelMetricsData } from "../types";

interface FunnelChartProps {
  metrics: FunnelMetricsData;
}

export function FunnelChart({ metrics }: FunnelChartProps) {
  const {
    users,
    flyerUsers,
    flyerEmails,
    flyerUsersWithAccounts,
    createdAccount,
    tookAction,
    tookActionTwoDays,
    tookActionTenDays,
  } = metrics;
  
  const nonFlyerUsers = users - flyerUsers;
  const otherUsersWithAccounts = createdAccount - flyerUsersWithAccounts;

  const data = {
    nodes: [
      { name: "Users" },
      { name: "Users (Not From Flyers)" },
      { name: "Users (Flyers)" },
      { name: "Flyer Emails" },
      { name: "Created Account" },
      { name: "Took Action" },
      { name: "Active 2+ Days" },
      { name: "Active 10+ Days" },
    ],
    links: [
      { 
        source: 0,
        target: 1,
        value: Math.max(nonFlyerUsers, 0.1),
        actualValue: nonFlyerUsers
      },
      { 
        source: 0,
        target: 2,
        value: flyerUsers,
      },
      { 
        source: 2,
        target: 3,
        value: flyerEmails,
      },
      { 
        source: 1,
        target: 4,
        value: otherUsersWithAccounts,
      },
      { 
        source: 2,
        target: 4,
        value: flyerUsersWithAccounts,
      },
      { 
        source: 4,
        target: 5,
        value: tookAction,
      },
      { 
        source: 5,
        target: 6,
        value: tookActionTwoDays,
      },
      { 
        source: 6,
        target: 7,
        value: tookActionTenDays,
      },
    ].map(link => ({
      ...link,
      value: Math.max(link.value, 0.1),
      actualValue: link.value,
    }))
  };

  const counts = [
    users,
    nonFlyerUsers,
    flyerUsers,
    flyerEmails,
    createdAccount,
    tookAction,
    tookActionTwoDays,
    tookActionTenDays
  ];

  const calculateConversion = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current / previous) * 100).toFixed(1);
  };

  const conversions = [
    { label: "Users (Total)", count: users },
    {
      label: "Users (Flyers)",
      count: flyerUsers,
      rate: calculateConversion(flyerUsers, users),
    },
    {
      label: "Flyer Conversion",
      count: flyerUsersWithAccounts,
      rate: calculateConversion(flyerUsersWithAccounts, flyerUsers),
    },
    {
      label: "Created Account",
      count: createdAccount,
      rate: calculateConversion(createdAccount, users),
    },
    {
      label: "Took Action",
      count: tookAction,
      rate: calculateConversion(tookAction, createdAccount),
    },
    {
      label: "Active 2+ Days",
      count: tookActionTwoDays,
      rate: calculateConversion(tookActionTwoDays, tookAction),
    },
    {
      label: "Active 10+ Days",
      count: tookActionTenDays,
      rate: calculateConversion(tookActionTenDays, tookActionTwoDays),
    },
  ];

  const CustomNode = (props: any) => {
    const { x, y, width, height, index, payload } = props;
    const count = counts[index];

    return (
      <Layer key={`node-${index}`}>
        <Rectangle
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#8884d8"
          fillOpacity="1"
        />
        <text
          x={x + width + 10}
          y={y + height / 2}
          textAnchor="start"
          fontSize="14"
          fontWeight="600"
          fill="#1f2937"
        >
          {payload.name}
        </text>
        <text
          x={x + width + 10}
          y={y + height / 2 + 18}
          textAnchor="start"
          fontSize="16"
          fontWeight="700"
          fill="#3b82f6"
        >
          {count}
        </text>
      </Layer>
    );
  };

  const CustomLink = (props: any) => {
    const {
      sourceX,
      targetX,
      sourceY,
      targetY,
      sourceControlX,
      targetControlX,
      linkWidth,
      index,
    } = props;

    return (
      <Layer key={`link-${index}`}>
        <path
          d={`
            M${sourceX},${sourceY}
            C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
          `}
          fill="none"
          stroke="#8884d8"
          strokeWidth={linkWidth}
          strokeOpacity="0.3"
        />
      </Layer>
    );
  };

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={400}>
        <Sankey
          data={data}
          nodeWidth={10}
          nodePadding={60}
          node={<CustomNode />}
          link={<CustomLink />}
          margin={{ top: 20, right: 200, bottom: 20, left: 20 }}
        >
          <Tooltip 
            content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const data = payload[0].payload;
              if (data.source !== undefined) {
                const actualValue = data.actualValue ?? data.value;
                return (
                  <div className="bg-white border border-gray-200 p-3 rounded shadow-lg">
                    <p className="text-sm font-semibold">{actualValue} users</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </Sankey>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-4 px-4">
        {conversions.map((step) => (
          <div key={step.label} className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">{step.label}</div>
            <div className="flex items-baseline gap-3">
              <div className="text-2xl font-bold">{step.count}</div>
              {step.rate && (
                <div className="text-sm font-medium text-blue-600">
                  {step.rate}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}