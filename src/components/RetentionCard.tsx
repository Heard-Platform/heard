interface RetentionCardProps {
  title: string;
  cohortDescription: string;
  rate: number;
  retained: number;
  eligible: number;
  totalInCohort: number;
  activityWindow: string;
  colorScheme: 'blue' | 'purple' | 'green';
}

const colorSchemes = {
  blue: 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-100',
  purple: 'bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-100',
  green: 'bg-gradient-to-br from-green-50/50 to-emerald-50/50 border-green-100',
};

export function RetentionCard({
  title,
  cohortDescription,
  rate,
  retained,
  eligible,
  totalInCohort,
  activityWindow,
  colorScheme,
}: RetentionCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${colorSchemes[colorScheme]}`}>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-3">
        For the {eligible} accounts old enough out of {totalInCohort} accounts created in the past {cohortDescription}
      </p>
      <p className="text-3xl mb-2">{rate}%</p>
      <p className="text-xs text-muted-foreground">
        {retained} of {eligible} users returned in {activityWindow}
      </p>
    </div>
  );
}
