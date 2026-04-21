import { StatementVotesTable, StatementVoteRow } from "../components/analysis/StatementVotesTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default {
  title: "Analysis/StatementVotesTable",
};

const mockStatements: StatementVoteRow[] = [
  {
    id: "s-1",
    text: "We should invest more in renewable energy infrastructure to reduce our carbon footprint and create green jobs for the future.",
    agreeVotes: 142,
    superAgreeVotes: 38,
    disagreeVotes: 23,
    passVotes: 15,
    totalVotes: 218,
  },
  {
    id: "s-2",
    text: "Public transportation improvements should be prioritized over expanding highway systems.",
    agreeVotes: 98,
    superAgreeVotes: 12,
    disagreeVotes: 45,
    passVotes: 22,
    totalVotes: 177,
  },
  {
    id: "s-3",
    text: "Community gardens and urban green spaces contribute significantly to neighborhood wellbeing.",
    agreeVotes: 87,
    superAgreeVotes: 9,
    disagreeVotes: 31,
    passVotes: 28,
    totalVotes: 155,
  },
  {
    id: "s-4",
    text: "We should completely ban cars in the downtown core to prioritize pedestrian spaces.",
    agreeVotes: 18,
    superAgreeVotes: 5,
    disagreeVotes: 112,
    passVotes: 25,
    totalVotes: 160,
  },
  {
    id: "s-5",
    text: "Property taxes should be tripled to fund ambitious green initiatives.",
    agreeVotes: 22,
    superAgreeVotes: 3,
    disagreeVotes: 96,
    passVotes: 14,
    totalVotes: 135,
  },
  {
    id: "s-6",
    text: "All parking lots should be converted to housing developments immediately.",
    agreeVotes: 15,
    superAgreeVotes: 2,
    disagreeVotes: 78,
    passVotes: 19,
    totalVotes: 114,
  },
  {
    id: "s-7",
    text: "Local food production should be subsidized to reduce reliance on imported goods.",
    agreeVotes: 74,
    superAgreeVotes: 18,
    disagreeVotes: 41,
    passVotes: 20,
    totalVotes: 153,
  },
  {
    id: "s-8",
    text: "Schools should teach environmental stewardship as a core curriculum subject.",
    agreeVotes: 110,
    superAgreeVotes: 44,
    disagreeVotes: 19,
    passVotes: 11,
    totalVotes: 184,
  },
];

export const Default = () => (
  <div className="p-4 max-w-4xl mx-auto">
    <StatementVotesTable statements={mockStatements} />
  </div>
);

export const Empty = () => (
  <div className="p-4 max-w-4xl mx-auto">
    <StatementVotesTable statements={[]} />
  </div>
);

export function StatementVotesTableStory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statement Votes Table</CardTitle>
        <CardDescription>
          Sortable breakdown of all statements and their vote counts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StatementVotesTable statements={mockStatements} />
      </CardContent>
    </Card>
  );
}
