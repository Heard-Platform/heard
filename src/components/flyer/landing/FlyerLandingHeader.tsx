export function FlyerLandingHeader({ community }: { community: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[28px] font-extrabold leading-none tracking-tight text-[#1C1B1F]">heard</span>
      {community && (
        <span className="rounded-full bg-[#E8E3D6] px-3 py-1.5 text-sm font-semibold text-[#1C1B1F]">{community}</span>
      )}
    </div>
  );
}
