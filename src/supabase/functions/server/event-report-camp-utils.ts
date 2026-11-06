import _ from "lodash";
import {
  calcDistinguishingScore,
  type VoteTally,
} from "./cluster-analysis.tsx";
import {
  buildNamingInputs,
  type ClusterNamingInput,
  findCommonGround,
} from "./cluster-naming-utils.ts";
import type { VotedStatement } from "./cluster-stance-utils.ts";
import {
  buildVotingMatrix,
  chooseClusterCount,
  kMeansClusteringMultiRun,
} from "./clustering.tsx";
import type {
  EventReportVote,
  StatementTally,
} from "./event-report-utils.ts";
import { percentOf } from "./utils.tsx";
import { toSimpleVote } from "./vote-type-utils.ts";
import type {
  EventReportBridge,
  EventReportCamp,
  EventReportCampAnalysis,
  EventReportCampStatement,
  EventReportStatementByCamp,
  VoteType,
} from "./types.tsx";

export const MIN_CAMP_SIZE = 3;
export const CAMP_AGREEMENT_THRESHOLD_PERCENT = 60;
export const MIN_CAMP_VOTES_ON_STATEMENT = 3;
export const CAMP_CLUSTERING_SEED = 1;

const REPRESENTATIVE_STATEMENT_COUNT = 3;
const CAMP_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const EMPTY_CAMP_ANALYSIS: EventReportCampAnalysis = {
  camps: [],
  statementsByCamp: [],
  bridges: [],
  commonGroundStatement: null,
};

export interface CampAnalysisInputs {
  tallies: StatementTally[];
  rankableTallies: StatementTally[];
  sessionVotes: EventReportVote[];
}

export interface CampNamingRequest {
  membershipSignature: string;
  namingInputs: ClusterNamingInput[];
  commonGround: string[];
}

export interface CampAnalysisResult {
  campAnalysis: EventReportCampAnalysis;
  campNamingRequest: CampNamingRequest | null;
}

const NO_CAMPS_RESULT: CampAnalysisResult = {
  campAnalysis: EMPTY_CAMP_ANALYSIS,
  campNamingRequest: null,
};

interface CampMembers {
  campId: string;
  name: string;
  memberIds: string[];
}

interface CampVoteTally {
  agreeCount: number;
  disagreeCount: number;
  voteCount: number;
}

interface RepresentativeCandidate {
  tally: StatementTally;
  campVoteTally: CampVoteTally;
  otherCampsVoteTally: CampVoteTally;
  distinguishingScore: number;
}

interface StatementCampTallies {
  tally: StatementTally;
  campVoteTallies: CampVoteTally[];
}

type VotersByStatementId = Record<string, Record<string, VoteType>>;

const buildVotersByStatementId = (
  sessionVotes: EventReportVote[],
): VotersByStatementId => {
  const votersByStatementId: VotersByStatementId = {};
  for (const vote of _.sortBy(sessionVotes, "timestamp")) {
    votersByStatementId[vote.statementId] ??= {};
    const voters = votersByStatementId[vote.statementId];
    voters[vote.userId] = vote.voteType;
  }
  return votersByStatementId;
};

export const findCampEligibleUserIds = (
  sessionVotes: EventReportVote[],
  statementCount: number,
): string[] => {
  const minStatementsVotedOn = Math.ceil(statementCount / 2);
  const votesByUserId = _.groupBy(sessionVotes, "userId");
  return Object.keys(votesByUserId).filter((userId) => {
    const statementsVotedOnCount = _.uniqBy(
      votesByUserId[userId],
      "statementId",
    ).length;
    return statementsVotedOnCount >= minStatementsVotedOn;
  });
};

const nameCamp = (memberIds: string[], campIndex: number) => {
  const letter = CAMP_LETTERS[campIndex];
  return {
    campId: `camp-${letter.toLowerCase()}`,
    name: `Camp ${letter}`,
    memberIds,
  };
};

const clusterIntoCamps = (
  eligibleUserIds: string[],
  tallies: StatementTally[],
  votersByStatementId: VotersByStatementId,
): CampMembers[] => {
  const statementsWithVotes = tallies.map((tally) => {
    const voters = votersByStatementId[tally.statement.id] ?? {};
    return {
      id: tally.statement.id,
      votes: Object.keys(voters).map((userId) => ({
        userId,
        voteType: voters[userId],
      })),
    };
  });
  const votingMatrix = buildVotingMatrix(
    eligibleUserIds,
    statementsWithVotes,
  );
  const { assignments } = kMeansClusteringMultiRun(
    votingMatrix.matrix,
    chooseClusterCount(eligibleUserIds.length),
    undefined,
    undefined,
    CAMP_CLUSTERING_SEED,
  );
  const memberIdsByCluster: Record<number, string[]> = {};
  eligibleUserIds.forEach((userId, userIndex) => {
    const clusterIndex = assignments[userIndex];
    memberIdsByCluster[clusterIndex] ??= [];
    memberIdsByCluster[clusterIndex].push(userId);
  });
  const largeEnoughClusters = Object.values(
    memberIdsByCluster,
  ).filter((memberIds) => memberIds.length >= MIN_CAMP_SIZE);
  return _.orderBy(largeEnoughClusters, "length", "desc").map(
    nameCamp,
  );
};

const tallyCampVotes = (
  voters: Record<string, VoteType>,
  memberIds: string[],
): CampVoteTally => {
  const memberVoteTypes = memberIds
    .filter((userId) => userId in voters)
    .map((userId) => toSimpleVote(voters[userId]));
  return {
    agreeCount: memberVoteTypes.filter(
      (voteType) => voteType === "agree",
    ).length,
    disagreeCount: memberVoteTypes.filter(
      (voteType) => voteType === "disagree",
    ).length,
    voteCount: memberVoteTypes.length,
  };
};

const campAgreePercent = (campVoteTally: CampVoteTally): number =>
  percentOf(campVoteTally.agreeCount, campVoteTally.voteCount);

const listOtherCampMemberIds = (
  camps: CampMembers[],
  camp: CampMembers,
): string[] =>
  camps
    .filter((otherCamp) => otherCamp !== camp)
    .flatMap((otherCamp) => otherCamp.memberIds);

const toVoteTally = (campVoteTally: CampVoteTally): VoteTally => ({
  agrees: campVoteTally.agreeCount,
  disagrees: campVoteTally.disagreeCount,
  passes:
    campVoteTally.voteCount -
    campVoteTally.agreeCount -
    campVoteTally.disagreeCount,
});

const scoreRepresentativeCandidate = (
  tally: StatementTally,
  voters: Record<string, VoteType>,
  memberIds: string[],
  otherMemberIds: string[],
): RepresentativeCandidate => {
  const campVoteTally = tallyCampVotes(voters, memberIds);
  const otherCampsVoteTally = tallyCampVotes(voters, otherMemberIds);
  return {
    tally,
    campVoteTally,
    otherCampsVoteTally,
    distinguishingScore: calcDistinguishingScore(
      toVoteTally(campVoteTally),
      toVoteTally(otherCampsVoteTally),
    ),
  };
};

const candidateVoteCount = (candidate: RepresentativeCandidate) =>
  candidate.tally.voteCount;

const toCampStatement = (
  candidate: RepresentativeCandidate,
): EventReportCampStatement => ({
  statementId: candidate.tally.statement.id,
  text: candidate.tally.statement.text,
  postNumber: candidate.tally.postNumber,
  isAttendeeStatement: candidate.tally.isAttendeeStatement,
  campAgreePercent: campAgreePercent(candidate.campVoteTally),
  otherCampsAgreePercent: campAgreePercent(
    candidate.otherCampsVoteTally,
  ),
});

const listRepresentativeStatements = (
  camp: CampMembers,
  camps: CampMembers[],
  tallies: StatementTally[],
  votersByStatementId: VotersByStatementId,
): EventReportCampStatement[] => {
  const otherMemberIds = listOtherCampMemberIds(camps, camp);
  const candidates = tallies.map((tally) =>
    scoreRepresentativeCandidate(
      tally,
      votersByStatementId[tally.statement.id] ?? {},
      camp.memberIds,
      otherMemberIds,
    )
  );
  const agreedMoreThanTheRest = candidates
    .filter((candidate) => doesCampAgree(candidate.campVoteTally))
    .filter((candidate) => candidate.distinguishingScore > 0);
  return _.orderBy(
    agreedMoreThanTheRest,
    ["distinguishingScore", candidateVoteCount],
    ["desc", "desc"],
  )
    .slice(0, REPRESENTATIVE_STATEMENT_COUNT)
    .map(toCampStatement);
};

const toReportCamp = (
  camp: CampMembers,
  camps: CampMembers[],
  tallies: StatementTally[],
  votersByStatementId: VotersByStatementId,
): EventReportCamp => {
  const campMemberCount = _.sumBy(
    camps,
    (eachCamp: CampMembers) => eachCamp.memberIds.length,
  );
  return {
    campId: camp.campId,
    name: camp.name,
    memberCount: camp.memberIds.length,
    sizePercent: percentOf(camp.memberIds.length, campMemberCount),
    representativeStatements: listRepresentativeStatements(
      camp,
      camps,
      tallies,
      votersByStatementId,
    ),
  };
};

const tallyStatementByCamp = (
  tally: StatementTally,
  camps: CampMembers[],
  votersByStatementId: VotersByStatementId,
): StatementCampTallies => {
  const voters = votersByStatementId[tally.statement.id] ?? {};
  return {
    tally,
    campVoteTallies: camps.map((camp) =>
      tallyCampVotes(voters, camp.memberIds)
    ),
  };
};

const toStatementByCamp = (
  statementCampTallies: StatementCampTallies,
  camps: CampMembers[],
): EventReportStatementByCamp => {
  const { tally, campVoteTallies } = statementCampTallies;
  return {
    statementId: tally.statement.id,
    text: tally.statement.text,
    postNumber: tally.postNumber,
    isAttendeeStatement: tally.isAttendeeStatement,
    overallAgreePercent: percentOf(tally.agreeCount, tally.voteCount),
    campAgreements: camps.map((camp, campIndex) => ({
      campId: camp.campId,
      agreePercent: campAgreePercent(campVoteTallies[campIndex]),
    })),
  };
};

const doesCampAgree = (campVoteTally: CampVoteTally): boolean =>
  campVoteTally.voteCount >= MIN_CAMP_VOTES_ON_STATEMENT &&
  campAgreePercent(campVoteTally) >= CAMP_AGREEMENT_THRESHOLD_PERCENT;

const findMostAgreedAcrossCamps = (
  statementCampTallies: StatementCampTallies[],
  campIndexes: number[],
): StatementCampTallies | undefined => {
  const campTalliesFor = (candidate: StatementCampTallies) =>
    campIndexes.map(
      (campIndex) => candidate.campVoteTallies[campIndex],
    );
  const agreedByEveryCamp = statementCampTallies.filter((candidate) =>
    campTalliesFor(candidate).every(doesCampAgree)
  );
  const lowestCampAgreePercent = (candidate: StatementCampTallies) =>
    _.min(campTalliesFor(candidate).map(campAgreePercent)) ?? 0;
  return _.orderBy(
    agreedByEveryCamp,
    [lowestCampAgreePercent, statementVoteCount],
    ["desc", "desc"],
  )[0];
};

const statementVoteCount = (candidate: StatementCampTallies) =>
  candidate.tally.voteCount;

const listCampIndexPairs = (campCount: number): [number, number][] =>
  _.range(campCount).flatMap((firstIndex: number) =>
    _.range(firstIndex + 1, campCount).map(
      (secondIndex: number): [number, number] => [
        firstIndex,
        secondIndex,
      ],
    )
  );

const findBridges = (
  statementCampTallies: StatementCampTallies[],
  camps: CampMembers[],
  commonGround: StatementCampTallies | undefined,
): EventReportBridge[] => {
  const bridgeCandidates = statementCampTallies.filter(
    (candidate) => candidate !== commonGround,
  );
  return listCampIndexPairs(camps.length).flatMap(
    ([firstIndex, secondIndex]) => {
      const bridge = findMostAgreedAcrossCamps(bridgeCandidates, [
        firstIndex,
        secondIndex,
      ]);
      if (!bridge) return [];
      const campIds: [string, string] = [
        camps[firstIndex].campId,
        camps[secondIndex].campId,
      ];
      const statement = toStatementByCamp(bridge, camps);
      return [{ campIds, statement }];
    },
  );
};

const signCampMembership = (camps: CampMembers[]): string =>
  camps
    .map((camp) => _.sortBy(camp.memberIds).join(","))
    .join("|");

const buildCampNamingRequest = (
  camps: CampMembers[],
  tallies: StatementTally[],
  votersByStatementId: VotersByStatementId,
): CampNamingRequest => {
  const votedStatements: VotedStatement[] = tallies.map((tally) => ({
    id: tally.statement.id,
    text: tally.statement.text,
    voters: votersByStatementId[tally.statement.id] ?? {},
  }));
  const campIdentities = camps.map((camp) => ({
    stableId: camp.campId,
    memberIds: camp.memberIds,
  }));
  return {
    membershipSignature: signCampMembership(camps),
    namingInputs: buildNamingInputs(campIdentities, votedStatements),
    commonGround: findCommonGround(campIdentities, votedStatements),
  };
};

export const applyCampNames = (
  campAnalysis: EventReportCampAnalysis,
  campNames: string[] | null,
): EventReportCampAnalysis => {
  if (campNames === null) return campAnalysis;
  const namedCamps = campAnalysis.camps.map((camp, campIndex) => ({
    ...camp,
    name: campNames[campIndex] ?? camp.name,
  }));
  return { ...campAnalysis, camps: namedCamps };
};

export const buildCampAnalysis = (
  inputs: CampAnalysisInputs,
): CampAnalysisResult => {
  const votersByStatementId = buildVotersByStatementId(
    inputs.sessionVotes,
  );
  const eligibleUserIds = findCampEligibleUserIds(
    inputs.sessionVotes,
    inputs.tallies.length,
  );
  if (eligibleUserIds.length < MIN_CAMP_SIZE * 2) {
    return NO_CAMPS_RESULT;
  }
  const camps = clusterIntoCamps(
    eligibleUserIds,
    inputs.tallies,
    votersByStatementId,
  );
  if (camps.length < 2) return NO_CAMPS_RESULT;

  const statementCampTallies = inputs.rankableTallies.map((tally) =>
    tallyStatementByCamp(tally, camps, votersByStatementId)
  );
  const commonGround = findMostAgreedAcrossCamps(
    statementCampTallies,
    _.range(camps.length),
  );
  const campAnalysis: EventReportCampAnalysis = {
    camps: camps.map((camp) =>
      toReportCamp(camp, camps, inputs.tallies, votersByStatementId)
    ),
    statementsByCamp: statementCampTallies.map((candidate) =>
      toStatementByCamp(candidate, camps)
    ),
    bridges: findBridges(statementCampTallies, camps, commonGround),
    commonGroundStatement: commonGround
      ? toStatementByCamp(commonGround, camps)
      : null,
  };
  return {
    campAnalysis,
    campNamingRequest: buildCampNamingRequest(
      camps,
      inputs.tallies,
      votersByStatementId,
    ),
  };
};
