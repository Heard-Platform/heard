import "./report.css";

interface SectionLabelProps {
  sectionNumber: number;
  sectionName: string;
}

export function SectionLabel({
  sectionNumber,
  sectionName,
}: SectionLabelProps) {
  return (
    <p className="report-label text-xs opacity-70">
      {sectionNumber} · {sectionName}
    </p>
  );
}

interface SectionHeadingProps extends SectionLabelProps {
  headline: string;
  description: string;
}

export function SectionHeading({
  sectionNumber,
  sectionName,
  headline,
  description,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      <SectionLabel
        sectionNumber={sectionNumber}
        sectionName={sectionName}
      />
      <h2 className="report-header">{headline}</h2>
      <p className="max-w-2xl text-base opacity-80">{description}</p>
    </div>
  );
}