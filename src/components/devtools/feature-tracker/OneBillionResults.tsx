interface OneBillionResultsProps {
  pageLoad: number;
  clickProjects: number;
  clickOrg: number;
  clickForm: number;
  clickCopy: number;
}

export function OneBillionResults({
  pageLoad,
  clickProjects,
  clickOrg,
  clickForm,
  clickCopy,
}: OneBillionResultsProps) {
  const rate = (n: number, of: number) =>
    of === 0 ? undefined : ((n / of) * 100).toFixed(1);

  const steps = [
    { label: "Page Loads", count: pageLoad },
    {
      label: "Projects Clicks",
      count: clickProjects,
      rate: rate(clickProjects, pageLoad),
    },
    {
      label: "Org Clicks",
      count: clickOrg,
      rate: rate(clickOrg, pageLoad),
    },
    {
      label: "Form Clicks",
      count: clickForm,
      rate: rate(clickForm, pageLoad),
    },
    {
      label: "Copy Clicks",
      count: clickCopy,
      rate: rate(clickCopy, pageLoad),
    },
  ];

  return (
    <div className="flex gap-4">
      {steps.map((step) => (
        <div key={step.label} className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">{step.label}</p>
          <p className="text-2xl font-bold">{step.count}</p>
          {step.rate !== undefined && (
            <p className="text-xs text-muted-foreground">{step.rate}%</p>
          )}
        </div>
      ))}
    </div>
  );
}
