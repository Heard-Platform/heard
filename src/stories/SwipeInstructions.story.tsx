import { SwipeInstructions } from "../components/SwipeInstructions";

function MockStatementCard({ text }: { text: string }) {
  return (
    <div className="relative">
      <div className="p-6 rounded-xl border-2 border-border bg-card shadow-xl">
        <div className="heard-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
              CRUX
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 text-xs">
              ⤴
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 text-xs">
              ⋮
            </div>
          </div>
        </div>

        <div className="flex min-h-190px items-center justify-center">
          <p className="text-lg leading-relaxed text-center">{text}</p>
        </div>

        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground">2 hours ago</span>
          <span className="text-xs text-muted-foreground">128 votes</span>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <SwipeInstructions />
      </div>
    </div>
  );
}

export function SwipeInstructionsStory() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-foreground">Swipe Instructions Showcase</h1>
          <p className="text-muted-foreground">
            Confirms the instructions sit clear of the statement text and only
            overlap the top action row.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h2 className="text-foreground text-sm">Short statement</h2>
            <MockStatementCard text="Remote work should be the default for knowledge workers." />
          </div>

          <div className="space-y-2">
            <h2 className="text-foreground text-sm">Long statement</h2>
            <MockStatementCard text="Cities should prioritize public transit funding over new highway expansion projects, even if it means higher up-front costs and longer construction timelines in the short term." />
          </div>
        </div>
      </div>
    </div>
  );
}
