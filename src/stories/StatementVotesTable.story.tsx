import { StatementVotesTable } from "../components/analysis/StatementVotesTable";
import { StatementVotes } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default {
  title: "Analysis/StatementVotesTable",
};

const mockStatements: StatementVotes[] = [
  {
    id: "s-1",
    text: "We should invest more in renewable energy infrastructure to reduce our carbon footprint and create green jobs for the future.",
    agreeVotes: 180,
    rawAgreeVotes: 142,
    superAgreeVotes: 38,
    disagreeVotes: 23,
    passVotes: 15,
    totalVotes: 218,
    consensusScore: 65.1,
    mergedFrom: [],
  },
  {
    id: "s-2",
    text: "Public transportation improvements should be prioritized over expanding highway systems.",
    agreeVotes: 110,
    rawAgreeVotes: 98,
    superAgreeVotes: 12,
    disagreeVotes: 45,
    passVotes: 22,
    totalVotes: 177,
    consensusScore: 55.4,
    mergedFrom: [
      { id: "s-2m-1", text: "We should invest heavily in buses and trains to reduce private car usage." },
      { id: "s-2m-2", text: "Light rail and subway expansion should be a budget priority." },
    ],
  },
  {
    id: "s-3",
    text: "Community gardens and urban green spaces contribute significantly to neighborhood wellbeing.",
    agreeVotes: 96,
    rawAgreeVotes: 87,
    superAgreeVotes: 9,
    disagreeVotes: 31,
    passVotes: 28,
    totalVotes: 155,
    consensusScore: 56.1,
    mergedFrom: [],
  },
  {
    id: "s-4",
    text: "We should completely ban cars in the downtown core to prioritize pedestrian spaces.",
    agreeVotes: 23,
    rawAgreeVotes: 18,
    superAgreeVotes: 5,
    disagreeVotes: 112,
    passVotes: 25,
    totalVotes: 160,
    consensusScore: 11.3,
    mergedFrom: [],
  },
  {
    id: "s-5",
    text: "Property taxes should be tripled to fund ambitious green initiatives.",
    agreeVotes: 25,
    rawAgreeVotes: 22,
    superAgreeVotes: 3,
    disagreeVotes: 96,
    passVotes: 14,
    totalVotes: 135,
    consensusScore: 16.3,
    mergedFrom: [],
  },
  {
    id: "s-6",
    text: "All parking lots should be converted to housing developments immediately.",
    agreeVotes: 17,
    rawAgreeVotes: 15,
    superAgreeVotes: 2,
    disagreeVotes: 78,
    passVotes: 19,
    totalVotes: 114,
    consensusScore: 13.2,
    mergedFrom: [],
  },
  {
    id: "s-7",
    text: "Local food production should be subsidized to reduce reliance on imported goods.",
    agreeVotes: 92,
    rawAgreeVotes: 74,
    superAgreeVotes: 18,
    disagreeVotes: 41,
    passVotes: 20,
    totalVotes: 153,
    consensusScore: 48.4,
    mergedFrom: [],
  },
  {
    id: "s-8",
    text: "Schools should teach environmental stewardship as a core curriculum subject.",
    agreeVotes: 154,
    rawAgreeVotes: 110,
    superAgreeVotes: 44,
    disagreeVotes: 19,
    passVotes: 11,
    totalVotes: 184,
    consensusScore: 59.8,
    mergedFrom: [],
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
