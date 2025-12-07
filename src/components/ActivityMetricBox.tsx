interface ActivityMetricBoxProps {
  type: 'dau' | 'wau' | 'mau';
  value: number;
}

const CONFIG = {
  dau: {
    label: 'Daily Active Users (DAU)',
    sublabel: 'Last 24 hours',
    borderColor: 'border-blue-100',
    textColor: 'text-blue-600',
  },
  wau: {
    label: 'Weekly Active Users (WAU)',
    sublabel: 'Last 7 days',
    borderColor: 'border-indigo-100',
    textColor: 'text-indigo-600',
  },
  mau: {
    label: 'Monthly Active Users (MAU)',
    sublabel: 'Last 30 days',
    borderColor: 'border-purple-100',
    textColor: 'text-purple-600',
  },
};

export function ActivityMetricBox({ type, value }: ActivityMetricBoxProps) {
  const config = CONFIG[type];

  return (
    <div className={`bg-white rounded-lg p-4 border ${config.borderColor}`}>
      <p className="text-sm text-muted-foreground mb-1">{config.label}</p>
      <p className={`text-3xl ${config.textColor}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{config.sublabel}</p>
    </div>
  );
}
