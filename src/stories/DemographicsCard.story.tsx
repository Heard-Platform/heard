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

const questions: DemographicQuestion[] = [
  {
    id: 1,
    type: "gender",
  },
  {
    id: 2,
    type: "age_range",
  },
  {
    id: 3,
    type: "occupation",
  },
  {
    id: 4,
    type: "custom",
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
  const handleAnswer = (index: number, answer: string) => {
    console.log(`Question ${index} answered:`, answer);
  };

  return (
    <div className="space-y-8">
      <SwipeableStatementStack
        statements={[]}
        currentUserId="demo-user"
        allowAnonymous={true}
        isAnonymous={false}
        chanceCardSwiped={true}
        youtubeCardSwiped={true}
        demographicQuestions={questions}
        onVote={async () => {}}
        onSubmitStatement={async () => {}}
        onShowAccountSetupModal={() => {}}
        onChanceCardSwiped={async () => {}}
        onYouTubeCardSwiped={async () => {}}
        onDemographicsAnswer={handleAnswer}
      />
    </div>
  );
}
