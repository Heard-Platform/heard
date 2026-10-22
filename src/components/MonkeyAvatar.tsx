import monkeyImg from "/monkey.png";

export function MonkeyAvatar({ className }: { className: string }) {
  return <img src={monkeyImg} alt="" className={`heard-primary-gradient shrink-0 rounded-full object-cover ${className}`} />;
}
