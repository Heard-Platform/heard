import { StatementSpectrum } from "../components/analysis/StatementSpectrum";
import { StatementVotes } from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export default {
  title: "Analysis/StatementSpectrum",
};

function mkStmt(
  id: string,
  text: string,
  agreeVotes: number,
  disagreeVotes: number,
): StatementVotes {
  const passVotes = Math.max(0, 100 - agreeVotes - disagreeVotes);
  return {
    id,
    text,
    agreeVotes,
    rawAgreeVotes: agreeVotes,
    superAgreeVotes: 0,
    disagreeVotes,
    passVotes,
    consensusScore: agreeVotes - disagreeVotes,
    totalVotes: agreeVotes + disagreeVotes + passVotes,
    mergedFrom: [],
    clusterVotes: [],
  };
}

const neighborhoodSeeds: Array<[string, number, number]> = [
  ["Keep the public library funded", 96, 1],
  ["Repair broken streetlights promptly", 95, 1],
  ["Pick up litter in parks weekly", 94, 2],
  ["Keep crosswalks clearly painted", 94, 2],
  ["Maintain restrooms at the main park", 93, 2],
  ["Plow snow on side streets in winter", 92, 2],
  ["Improve school bus drop-off safety", 92, 2],
  ["Plant more shade trees on hot streets", 91, 2],
  ["Test water quality at the splash pad", 91, 1],
  ["Keep the rec center free for kids", 90, 3],
  ["Stock the food pantry through winter", 90, 2],
  ["Repair the broken bench at the bus stop", 90, 2],
  ["Maintain the pedestrian bridge over Cedar Creek", 89, 2],
  ["Keep the senior shuttle running on Sundays", 89, 3],
  ["Thank volunteer crossing guards publicly", 89, 2],
  ["Speed bumps on Webster St", 88, 2],
  ["Add more street lighting downtown", 85, 3],
  ["Fix potholes on Main Ave before anything else", 83, 4],
  ["More trash cans near the playground", 81, 3],
  ["Repaint crosswalks on Elm and 5th", 79, 5],
  ["Community center should stay open until 10pm", 77, 6],
  ["We need a dog park", 74, 7],
  ["Bike lanes on Oak Street are long overdue", 72, 8],
  ["Library needs Saturday evening hours", 70, 7],
  ["Sidewalk repair is the single top priority", 68, 9],
  ["More benches along the river walk", 66, 10],
  ["Replace broken playground equipment", 65, 8],
  ["New bus route connecting the west side", 63, 11],
  ["Outdoor dining permits take too long", 61, 12],
  ["Block parties should be easier to permit", 59, 11],
  ["The old firehouse should become a community hub", 57, 14],
  ["Install a public water fountain near the park", 56, 10],
  ["Expand farmers market to year-round", 54, 13],
  ["More accessible ramps on downtown curbs", 53, 9],
  ["Free wifi in public spaces", 51, 15],
  ["Parking minimums should be reduced", 49, 20],
  ["New apartments near transit are a good thing", 47, 22],
  ["Short-term rentals hurt housing availability", 45, 23],
  ["Scooter parking needs designated zones", 43, 19],
  ["Zoning should allow corner stores in residential blocks", 41, 26],
  ["Market-rate housing helps affordability over time", 39, 28],
  ["The neighborhood needs more nightlife options", 37, 30],
  ["Food trucks should be allowed on more streets", 35, 27],
  ["Historic buildings deserve tax incentives", 33, 29],
  ["More density near the park is acceptable", 31, 31],
  ["Police presence in the park feels excessive", 29, 33],
  ["New development should be paused for two years", 27, 36],
  ["The community needs a co-working space", 25, 32],
  ["Luxury condos damage neighborhood character", 23, 38],
  ["Public housing is the only real answer", 21, 40],
  ["Rent control should be expanded citywide", 20, 39],
  ["Upzoning requires a community referendum", 18, 41],
  ["Abolish parking minimums entirely", 16, 43],
  ["Defunding police would make us safer", 14, 46],
  ["All new development should be 100% affordable", 12, 45],
  ["The neighborhood is changing too fast", 11, 44],
  ["Cars should be banned from the main corridor", 9, 50],
  ["Single-family zoning must be preserved", 8, 52],
  ["Any new shelter siting needs resident approval", 7, 48],
  ["Height limits should stay permanent", 6, 51],
];

const neighborhoodStatements: StatementVotes[] = neighborhoodSeeds.map(
  ([text, a, d], i) => mkStmt(`n-${i}`, text, a, d),
);

const sparseStatements: StatementVotes[] = [
  mkStmt("s-0", "We need more parks", 82, 5),
  mkStmt("s-1", "Library hours should be extended", 65, 12),
  mkStmt("s-2", "Convert empty lots into community gardens", 48, 22),
  mkStmt("s-3", "Ban gas-powered leaf blowers", 33, 38),
  mkStmt("s-4", "Triple the property tax to fund schools", 14, 55),
];

export const Default = () => (
  <div className="p-4 max-w-3xl mx-auto">
    <StatementSpectrum statements={neighborhoodStatements} />
  </div>
);

export const Sparse = () => (
  <div className="p-4 max-w-3xl mx-auto">
    <StatementSpectrum statements={sparseStatements} />
  </div>
);

export const Narrow = () => (
  <div className="p-4 max-w-sm mx-auto">
    <StatementSpectrum statements={neighborhoodStatements} />
  </div>
);

export const Empty = () => (
  <div className="p-4 max-w-3xl mx-auto">
    <StatementSpectrum statements={[]} />
  </div>
);

export function StatementSpectrumStory() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statement Spectrum</CardTitle>
          <CardDescription>
            Hover or drag across the strip to inspect statements binned along the
            consensus-to-divisive axis. Click to pin a slice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatementSpectrum statements={neighborhoodStatements} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sparse (5 statements)</CardTitle>
          <CardDescription>
            Verifies anchor labels and dot spacing with a much smaller dataset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatementSpectrum statements={sparseStatements} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Narrow container</CardTitle>
          <CardDescription>
            Resize behavior: same data, constrained width.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <StatementSpectrum statements={neighborhoodStatements} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empty</CardTitle>
          <CardDescription>No statements supplied.</CardDescription>
        </CardHeader>
        <CardContent>
          <StatementSpectrum statements={[]} />
        </CardContent>
      </Card>
    </div>
  );
}
