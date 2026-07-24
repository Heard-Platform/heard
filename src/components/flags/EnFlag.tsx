type FlagProps = { className?: string };

const STRIPES = Array.from({ length: 13 }, (_, index) => index);
const STRIPE_HEIGHT = 14 / 13;

export function EnFlag({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 26 14" className={className} aria-hidden="true">
      {STRIPES.map((index) => (
        <rect
          key={index}
          y={index * STRIPE_HEIGHT}
          width="26"
          height={STRIPE_HEIGHT}
          fill={index % 2 === 0 ? "#b22234" : "#ffffff"}
        />
      ))}
      <rect width="11" height={STRIPE_HEIGHT * 7} fill="#3c3b6e" />
    </svg>
  );
}
