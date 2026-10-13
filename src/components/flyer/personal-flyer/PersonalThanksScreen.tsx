import { KeepVotingCard } from "./KeepVotingCard";
import { PersonalFlyerHeader } from "./PersonalFlyerHeader";
import { useRiseIn } from "./use-rise-in";
import { COLORS, HEADLINE_CLASS, RESULTS_SENDER_EMAIL } from "./personal-flyer-theme";

export function PersonalThanksScreen({ onKeepVoting }: { onKeepVoting: () => void }) {
  const riseIn = useRiseIn();

  return (
    <div className="heard-feed-bg flex min-h-full flex-col px-7 pb-7 pt-8">
      <PersonalFlyerHeader />

      <h1 className={`${HEADLINE_CLASS} mt-7 text-[34px]`} style={{ color: COLORS.ink, ...riseIn(0) }}>
        Thanks! Results on the way.
      </h1>

      <p className="mt-5 text-base leading-relaxed" style={{ color: COLORS.body, ...riseIn(150) }}>
        Keep an eye out in case it lands in spam. It'll be from{" "}
        <strong style={{ color: COLORS.ink }}>{RESULTS_SENDER_EMAIL}</strong>.
      </p>

      <div className="mt-auto pt-8" style={riseIn(350)}>
        <KeepVotingCard title="Got a minute? Vote on a few more hot takes." onKeepVoting={onKeepVoting} />
      </div>
    </div>
  );
}
