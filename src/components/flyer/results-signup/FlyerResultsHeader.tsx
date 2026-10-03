export function FlyerResultsHeader({ tagline }: { tagline?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[26px] font-extrabold leading-none tracking-tight text-[#1C1B1F]">heard</span>
      {tagline && <span className="text-xs text-[#4A463F]">{tagline}</span>}
    </div>
  );
}
