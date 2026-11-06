import "./report.css";

interface ChapterHeadingProps {
  chapterNumber: number;
  chapterName: string;
  headline: string;
  description: string;
}

export function ChapterHeading({
  chapterNumber,
  chapterName,
  headline,
  description,
}: ChapterHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="report-label text-xs secondary-text">
        Chapter {chapterNumber} · {chapterName}
      </p>
      <h2 className="report-header">{headline}</h2>
      <p className="max-w-2xl text-base secondary-text-strong">
        {description}
      </p>
    </div>
  );
}