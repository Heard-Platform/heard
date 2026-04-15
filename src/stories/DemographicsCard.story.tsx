import { DemographicsCard } from "../components/room/DemographicsCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import type {
  DemographicQuestion
} from "../types";
import { useState } from "react";
import { mockRooms } from "./mockData";

const questions: DemographicQuestion[] = [
  {
    id: "1",
    type: "gender",
    roomId: "room1",
  },
  {
    id: "2",
    type: "age_range",
    roomId: "room1",
  },
  {
    id: "3",
    type: "occupation",
    roomId: "room1",
  },
  {
    id: "4",
    type: "custom",
    roomId: "room1",
    text: "Do you currently live in Washington, DC?",
    options: ["Yes", "No"],
  },
];

export function DemographicsCardStory() {
  const handleAnswer = (answer: string) => {
    console.log("User answered:", answer);
    alert(`You answered: ${answer}`);
  };

  return (
    <Tabs defaultValue="grid" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="grid">Grid View</TabsTrigger>
        <TabsTrigger value="stack">Swipeable Stack</TabsTrigger>
      </TabsList>

      <TabsContent value="grid">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Demographics Card Examples
            </h2>
            <p className="text-muted-foreground mb-6">
              Interactive cards for collecting demographic information
              from users
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {questions.map((question, idx) => (
              <div key={idx}>
                <h3 className="font-semibold mb-3">{`Question Type: ${question.type}`}</h3>
                <DemographicsCard
                  question={question}
                  onAnswer={handleAnswer}
                />
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="stack">
        <DemographicsSwipeableStack />
      </TabsContent>
    </Tabs>
  );
}

function DemographicsSwipeableStack() {
  const [questionIds, setQuestionIds] = useState<Set<string>>(new Set());

  const handleAnswer = (questionId: string) => {
    console.log(`Question ${questionId} answered`);
    setQuestionIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(questionId);
      return newSet;
    });
  };

  return (
    <div className="space-y-8">
      <SwipeableStatementStack
        room={mockRooms[0]}
        statements={[]}
        currentUserId="demo-user"
        allowAnonymous={true}
        isAnonymous={false}
        chanceCardSwiped={true}
        youtubeCardSwiped={true}
        demographicQuestions={questions}
        answeredQuestionIds={questionIds}
        onVote={async () => { } }
        onSubmitStatement={async () => { } }
        onShowAccountSetupModal={() => { } }
        onCertifyDone={async () => { } }
        onChanceCardSwiped={async () => { } }
        onYouTubeCardSwiped={async () => { } }
        onDemographicsAnswered={handleAnswer}
      />
    </div>
  );
}
