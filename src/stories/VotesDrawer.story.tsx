import { VotesDrawer } from "../components/results/VotesDrawer";
import type { Statement } from "../types";

// Mock data with various vote distributions
const mockStatements: Statement[] = [
  {
    id: "1",
    text: "Climate change is the most pressing issue of our generation and requires immediate global action.",
    user_id: "user1",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "agree",
      "voter2": "agree",
      "voter3": "agree",
      "voter4": "agree",
      "voter5": "agree",
      "voter6": "super_agree",
      "voter7": "super_agree",
      "voter8": "disagree",
      "voter9": "pass",
    }
  },
  {
    id: "2",
    text: "Pineapple belongs on pizza and anyone who disagrees is wrong.",
    user_id: "user2",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "disagree",
      "voter2": "disagree",
      "voter3": "disagree",
      "voter4": "disagree",
      "voter5": "disagree",
      "voter6": "disagree",
      "voter7": "agree",
      "voter8": "agree",
      "voter9": "super_agree",
    }
  },
  {
    id: "3",
    text: "Remote work is more productive than office work for most knowledge workers.",
    user_id: "user3",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "agree",
      "voter2": "agree",
      "voter3": "agree",
      "voter4": "disagree",
      "voter5": "disagree",
      "voter6": "pass",
      "voter7": "pass",
      "voter8": "pass",
      "voter9": "super_agree",
    }
  },
  {
    id: "4",
    text: "Cats are superior to dogs as pets.",
    user_id: "user4",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "super_agree",
      "voter2": "super_agree",
      "voter3": "super_agree",
      "voter4": "super_agree",
      "voter5": "super_agree",
      "voter6": "disagree",
      "voter7": "disagree",
    }
  },
  {
    id: "5",
    text: "Social media has done more harm than good to society.",
    user_id: "user5",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "pass",
      "voter2": "pass",
      "voter3": "pass",
      "voter4": "pass",
      "voter5": "pass",
      "voter6": "agree",
      "voter7": "disagree",
    }
  },
  {
    id: "6",
    text: "Artificial intelligence will create more jobs than it destroys.",
    user_id: "user6",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "agree",
      "voter2": "disagree",
      "voter3": "pass",
      "voter4": "super_agree",
    }
  },
  {
    id: "7",
    text: "The movie is always better than the book.",
    user_id: "user7",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "disagree",
      "voter2": "disagree",
      "voter3": "disagree",
      "voter4": "disagree",
      "voter5": "disagree",
      "voter6": "disagree",
      "voter7": "disagree",
      "voter8": "disagree",
      "voter9": "agree",
      "voter10": "pass",
    }
  },
  {
    id: "8",
    text: "Universal basic income is a viable solution to automation-driven unemployment.",
    user_id: "user8",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "agree",
      "voter2": "agree",
      "voter3": "super_agree",
      "voter4": "super_agree",
      "voter5": "disagree",
      "voter6": "disagree",
      "voter7": "disagree",
      "voter8": "pass",
    }
  },
  {
    id: "9",
    text: "Coffee is objectively better than tea.",
    user_id: "user9",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "super_agree",
      "voter2": "agree",
      "voter3": "agree",
      "voter4": "disagree",
      "voter5": "pass",
    }
  },
  {
    id: "10",
    text: "Video games should be considered a legitimate form of art.",
    user_id: "user10",
    created_at: new Date().toISOString(),
    voters: {
      "voter1": "super_agree",
      "voter2": "super_agree",
      "voter3": "super_agree",
      "voter4": "super_agree",
      "voter5": "agree",
      "voter6": "agree",
      "voter7": "agree",
      "voter8": "agree",
      "voter9": "agree",
      "voter10": "disagree",
    }
  },
];

export function VotesDrawerStory() {
  const handleChangeVote = async (statementId: string, newVote: any) => {
    console.log("Vote changed:", { statementId, newVote });
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <VotesDrawer
          statements={mockStatements}
          currentUserId="voter1"
          debateTitle="Is pineapple on pizza acceptable?"
          onChangeVote={handleChangeVote}
        />
      </div>
    </div>
  );
}
