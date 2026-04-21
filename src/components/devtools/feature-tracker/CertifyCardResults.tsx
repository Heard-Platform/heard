interface CertifyCardResultsProps {
  shown: number;
  phoneSubmitted: number;
  verified: number;
  dismissed: number;
}

export function CertifyCardResults({ shown, phoneSubmitted, verified, dismissed }: CertifyCardResultsProps) {
  const rate = (n: number, of: number) =>
    of === 0 ? undefined : ((n / of) * 100).toFixed(1);

  const steps = [
    { label: "Card Shown", count: shown },
    { label: "Phone Submitted", count: phoneSubmitted, rate: rate(phoneSubmitted, shown) },
    { label: "Verified", count: verified, rate: rate(verified, phoneSubmitted) },
    { label: "Dismissed", count: dismissed, rate: rate(dismissed, shown) },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
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
