import { useState } from "react";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { Statement, VoteType } from "../types";
import { mockRooms } from "./mockData";

const musicLeagueRoom = {
  ...mockRooms[0],
  id: "music-league-room",
  topic: "Songs that instantly make you dance",
  mode: "music-league" as const,
  imageUrl: undefined,
};

const mockSongs: Statement[] = [
  {
    id: "song-1",
    text: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    author: "user-1",
    agrees: 45,
    disagrees: 12,
    passes: 3,
    superAgrees: 23,
    roomId: musicLeagueRoom.id,
    timestamp: Date.now() - 300000,
    round: 1,
    voters: {},
  },
  {
    id: "song-2",
    text: "https://www.youtube.com/watch?v=y6120QOlsfU",
    author: "user-2",
    agrees: 32,
    disagrees: 28,
    passes: 8,
    superAgrees: 15,
    roomId: musicLeagueRoom.id,
    timestamp: Date.now() - 240000,
    round: 1,
    voters: {},
  },
  {
    id: "song-3",
    text: "https://www.youtube.com/watch?v=2Vv-BfVoq4g",
    author: "user-3",
    agrees: 56,
    disagrees: 18,
    passes: 5,
    superAgrees: 34,
    roomId: musicLeagueRoom.id,
    timestamp: Date.now() - 180000,
    round: 1,
    voters: {},
  },
];

export function MusicLeagueCardStackStory() {
  const [log, setLog] = useState<string[]>([]);

  const handleVote = async (statementId: string, voteType: VoteType) => {
    setLog((prev) => [`Vote: ${statementId} -> ${voteType}`, ...prev].slice(0, 5));
  };

  const handleSubmitStatement = async (text: string) => {
    setLog((prev) => [`Submit song: ${text}`, ...prev].slice(0, 5));
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Mock preview of the Music League card stack. Each card hides its YouTube
        player behind a simple placeholder and only the top card autoplays.
        Swipe/vote to see the next song play.
      </p>
      <div className="bg-slate-100 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
        <SwipeableStatementStack
          room={musicLeagueRoom}
          statements={mockSongs}
          currentUserId="story-user"
          allowAnonymous={true}
          isAnonymous={false}
          chanceCardSwiped={true}
          cover={null}
          coverCardSwiped={true}
          demographicQuestions={[]}
          answeredQuestionIds={new Set()}
          isActive={true}
          onVote={handleVote}
          onSubmitStatement={handleSubmitStatement}
          onShowAccountSetupModal={() => {}}
          onChanceCardSwiped={async () => {}}
          onCoverCardSwiped={async () => {}}
          onCertifyDone={() => {}}
          onDemographicsAnswered={() => {}}
        />
      </div>
      {log.length > 0 && (
        <div className="p-4 rounded-lg border bg-muted/30 text-xs space-y-1">
          {log.map((entry, i) => (
            <div key={i}>{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
