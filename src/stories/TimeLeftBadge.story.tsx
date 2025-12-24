import { TimeLeftBadge } from "../components/room/TimeLeftBadge";

export function TimeLeftBadgeStory() {
  const now = Date.now();
  const badges = [
    { endTime: now + 7 * 24 * 60 * 60 * 1000, label: '7 days' },
    { endTime: now + 3 * 24 * 60 * 60 * 1000, label: '3 days' },
    { endTime: now + 1 * 24 * 60 * 60 * 1000, label: '1 day' },
    { endTime: now + 23 * 60 * 60 * 1000, label: '23 hours' },
    { endTime: now + 12 * 60 * 60 * 1000, label: '12 hours' },
    { endTime: now + 6 * 60 * 60 * 1000, label: '6 hours' },
    { endTime: now + 1 * 60 * 60 * 1000, label: '1 hour' },
    { endTime: now + 45 * 60 * 1000, label: '45 minutes' },
    { endTime: now + 30 * 60 * 1000, label: '30 minutes' },
    { endTime: now + 15 * 60 * 1000, label: '15 minutes' },
    { endTime: now + 5 * 60 * 1000, label: '5 minutes' },
    { endTime: now + 1 * 60 * 1000, label: '1 minute' },
    { endTime: now + 59 * 1000, label: '59 seconds' },
    { endTime: now + 30 * 1000, label: '30 seconds' },
    { endTime: now + 10 * 1000, label: '10 seconds' },
    { endTime: now + 5 * 1000, label: '5 seconds' },
    { endTime: now + 1 * 1000, label: '1 second' },
  ];

  const tenSecAgoMs = now - 10 * 1000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-foreground">Time Left Badge Showcase</h1>
          <p className="text-muted-foreground">
            Showing different urgency levels and time values
          </p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-foreground">Low Urgency (Days) - Muted Green, No Pulse</h2>
            <div className="flex flex-wrap gap-3">
              {badges.slice(0, 3).map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <TimeLeftBadge
                    endTime={badge.endTime}
                    createdAt={tenSecAgoMs}
                    isRealtime={true}
                  />
                  <span className="text-xs text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-foreground">Medium Urgency (Hours) - Yellow, Pulse</h2>
            <div className="flex flex-wrap gap-3">
              {badges.slice(3, 7).map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <TimeLeftBadge
                    endTime={badge.endTime}
                    createdAt={tenSecAgoMs}
                    isRealtime={true}
                  />
                  <span className="text-xs text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-foreground">High Urgency (Minutes) - Orange, Pulse + Glow</h2>
            <div className="flex flex-wrap gap-3">
              {badges.slice(7, 12).map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <TimeLeftBadge
                    endTime={badge.endTime}
                    createdAt={tenSecAgoMs}
                    isRealtime={true}
                  />
                  <span className="text-xs text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-foreground">Critical Urgency (Seconds) - Red 🔥, Pulse + Strong Glow</h2>
            <div className="flex flex-wrap gap-3">
              {badges.slice(12).map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <TimeLeftBadge
                    endTime={badge.endTime}
                    createdAt={tenSecAgoMs}
                    isRealtime={true}
                  />
                  <span className="text-xs text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}