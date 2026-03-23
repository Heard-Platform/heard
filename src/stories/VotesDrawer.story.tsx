import { VotesDrawer } from "../components/results/VotesDrawer";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import type { Statement } from "../types";
import { mockStatements as baseMockStatements, mockUser } from "./mockData";

// Mock data with various vote distributions
const mockStatements: Statement[] = [
  {
    id: "1",
    text: "Climate change is the most pressing issue of our generation and requires immediate global action.",
    author: "user1",
    timestamp: Date.now(),
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
    author: "user2",
    timestamp: Date.now(),
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
    author: "user3",
    timestamp: Date.now(),
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
    author: "user4",
    timestamp: Date.now(),
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
    author: "user5",
    timestamp: Date.now(),
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
    author: "user6",
    timestamp: Date.now(),
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
    author: "user7",
    timestamp: Date.now(),
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
    author: "user8",
    timestamp: Date.now(),
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
    author: "user9",
    timestamp: Date.now(),
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
    author: "user10",
    timestamp: Date.now(),
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
].map(stmt => ({
  ...stmt,
  ...baseMockStatements["debate-no-image"][0],
}));

const safelyGetUser = () => mockUser;
const safelyGetDevUser = () => ({...mockUser, isDeveloper: true});

export function VotesDrawerStory() {
  const handleChangeVote = async (
    statementId: string,
    newVote: any,
  ) => {
    console.log("Vote changed:", { statementId, newVote });
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const props = {
    statements: mockStatements,
    currentUserId: "voter1",
    debateTitle: "Is pineapple on pizza acceptable?",
    onChangeVote: handleChangeVote,
  };

  return (
    <>
      <DebateSessionProvider showcaseOverrides={{ safelyGetUser }}>
        <div><p>Regular User</p></div>
        <VotesDrawer {...props} />
      </DebateSessionProvider>
      <DebateSessionProvider
        showcaseOverrides={{ safelyGetUser: safelyGetDevUser }}
        >
        <div><p>Developer User</p></div>
        <VotesDrawer {...props} />
      </DebateSessionProvider>
    </>
  );
}
