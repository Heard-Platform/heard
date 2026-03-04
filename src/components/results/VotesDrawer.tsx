import { useState } from "react";
import { motion } from "motion/react";
import {
  Eye,
  CheckCircle,
  XCircle,
  MinusCircle,
  Star,
  LucideIcon,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import type { Statement, VoteType, SortBy } from "../../types";
import { QRFlyerDialog } from "./QRFlyerDialog";
import { useDebateSession } from "../../hooks/useDebateSession";

interface VotesDrawerProps {
  statements: Statement[];
  debateTitle: string;
  onChangeVote: (statementId: string, newVote: VoteType) => Promise<void>;
}

const voteTypeConfig: Record<VoteType, {
  icon: LucideIcon;
  borderColor: string;
  hoverColor: string;
  activeColor: string;
}> = {
  agree: {
    icon: CheckCircle,
    borderColor: "border-green-300",
    hoverColor: "hover:bg-green-50",
    activeColor: "bg-green-100 border-green-400"
  },
  disagree: {
    icon: XCircle,
    borderColor: "border-red-300",
    hoverColor: "hover:bg-red-50",
    activeColor: "bg-red-100 border-red-400"
  },
  super_agree: {
    icon: Star,
    borderColor: "border-yellow-300",
    hoverColor: "hover:bg-yellow-50",
    activeColor: "bg-yellow-100 border-yellow-400"
  },
  pass: {
    icon: MinusCircle,
    borderColor: "border-gray-300",
    hoverColor: "hover:bg-gray-50",
    activeColor: "bg-gray-100 border-gray-400"
  }
};

interface SortButtonProps {
  type: VoteType;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function SortButton({ type, count, isActive, onClick }: SortButtonProps) {
  const config = voteTypeConfig[type];
  const Icon = config.icon;
  
  return (
    <Button
      size="sm"
      variant={isActive ? "default" : "outline"}
      className={`h-8 px-2.5 flex items-center gap-1.5 ${isActive ? "" : `${config.borderColor} ${config.hoverColor}`}`}
      disabled={false}
      onClick={onClick}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-sm">{count}</span>
    </Button>
  );
}

interface VoteButtonProps {
  type: VoteType;
  count: number;
  isUserVote: boolean;
  isChanging: boolean;
  onClick: () => void;
}

function VoteButton({ 
  type, 
  count, 
  isUserVote, 
  isChanging, 
  onClick 
}: VoteButtonProps) {
  const config = voteTypeConfig[type];
  const Icon = config.icon;
  
  return (
    <Button
      size="sm"
      variant="outline"
      className={`h-8 px-2.5 flex items-center gap-1.5 flex-1 ${
        isUserVote ? config.activeColor : `${config.borderColor} ${config.hoverColor}`
      }`}
      disabled={isChanging}
      onClick={onClick}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-sm">{count}</span>
    </Button>
  );
}

export function VotesDrawer({
  statements,
  debateTitle,
  onChangeVote,
}: VotesDrawerProps) {
  const { safelyGetUser } = useDebateSession();
  const user = safelyGetUser();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [changingVoteId, setChangingVoteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("none");
  const [qrDialogStatement, setQrDialogStatement] = useState<Statement | null>(null);

  const getUserVote = (statement: Statement): VoteType | null => {
    if (!statement.voters?.[user.id]) return null;
    return statement.voters[user.id];
  };

  const getVoteCounts = (statement: Statement) => {
    if (!statement.voters) return { agree: 0, disagree: 0, pass: 0, super_agree: 0 };
    
    const counts = { agree: 0, disagree: 0, pass: 0, super_agree: 0 };
    Object.values(statement.voters).forEach((vote) => {
      if (vote === "agree" || vote === "disagree" || vote === "pass" || vote === "super_agree") {
        counts[vote]++;
      }
    });
    return counts;
  };

  const handleChangeVote = async (statementId: string, newVote: VoteType) => {
    setChangingVoteId(statementId);
    try {
      await onChangeVote(statementId, newVote);
    } finally {
      setChangingVoteId(null);
    }
  };

  // Calculate total votes by type
  const totalVotes = statements.reduce(
    (acc, statement) => {
      const counts = getVoteCounts(statement);
      acc.agree += counts.agree;
      acc.disagree += counts.disagree;
      acc.super_agree += counts.super_agree;
      acc.pass += counts.pass;
      return acc;
    },
    { agree: 0, disagree: 0, super_agree: 0, pass: 0 }
  );

  const sortedStatements = [...statements].sort((a, b) => {
    const aCounts = getVoteCounts(a);
    const bCounts = getVoteCounts(b);
    if (sortBy === "agree") return bCounts.agree - aCounts.agree;
    if (sortBy === "disagree") return bCounts.disagree - aCounts.disagree;
    if (sortBy === "super_agree") return bCounts.super_agree - aCounts.super_agree;
    if (sortBy === "pass") return bCounts.pass - aCounts.pass;
    return 0;
  });

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs border-orange-300 hover:bg-orange-50 whitespace-nowrap"
        >
          <Eye className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">See Votes</span>
          <span className="sm:hidden">Votes</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full">
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 pr-12 border-b flex-shrink-0 space-y-3">
          <div>
            <SheetTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{debateTitle}</SheetTitle>
            <SheetDescription className="pt-1">
              <Badge variant="secondary" className="text-xs">
                {statements.length} statements
              </Badge>
            </SheetDescription>
          </div>
          
          {/* Sort buttons */}
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600">Sort by:</p>
            <div className="flex flex-wrap gap-1.5">
              <SortButton
                type="agree"
                count={totalVotes.agree}
                isActive={sortBy === "agree"}
                onClick={() => setSortBy(sortBy === "agree" ? "none" : "agree")}
              />
              <SortButton
                type="disagree"
                count={totalVotes.disagree}
                isActive={sortBy === "disagree"}
                onClick={() => setSortBy(sortBy === "disagree" ? "none" : "disagree")}
              />
              <SortButton
                type="super_agree"
                count={totalVotes.super_agree}
                isActive={sortBy === "super_agree"}
                onClick={() => setSortBy(sortBy === "super_agree" ? "none" : "super_agree")}
              />
              <SortButton
                type="pass"
                count={totalVotes.pass}
                isActive={sortBy === "pass"}
                onClick={() => setSortBy(sortBy === "pass" ? "none" : "pass")}
              />
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="py-4 space-y-3">
            {sortedStatements.map((statement) => {
              const counts = getVoteCounts(statement);
              const userVote = getUserVote(statement);
              const isChanging = changingVoteId === statement.id;

              return (
                <motion.div
                  key={statement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 sm:p-4 bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200 rounded-xl space-y-3 relative"
                >
                  {user.isDeveloper && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-7 w-7 p-0"
                      onClick={() => setQrDialogStatement(statement)}
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  )}

                  <p className="text-sm leading-relaxed pr-8">
                    {statement.text}
                  </p>

                  <div className="flex gap-2">
                    <VoteButton
                      type="agree"
                      count={counts.agree}
                      isUserVote={userVote === "agree"}
                      isChanging={isChanging}
                      onClick={() =>
                        handleChangeVote(statement.id, "agree")
                      }
                    />

                    <VoteButton
                      type="disagree"
                      count={counts.disagree}
                      isUserVote={userVote === "disagree"}
                      isChanging={isChanging}
                      onClick={() =>
                        handleChangeVote(statement.id, "disagree")
                      }
                    />

                    <VoteButton
                      type="super_agree"
                      count={counts.super_agree}
                      isUserVote={userVote === "super_agree"}
                      isChanging={isChanging}
                      onClick={() =>
                        handleChangeVote(statement.id, "super_agree")
                      }
                    />

                    <VoteButton
                      type="pass"
                      count={counts.pass}
                      isUserVote={userVote === "pass"}
                      isChanging={isChanging}
                      onClick={() =>
                        handleChangeVote(statement.id, "pass")
                      }
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </SheetContent>

      {qrDialogStatement &&
        <QRFlyerDialog
          statement={qrDialogStatement}
          isOpen={!!qrDialogStatement}
          onClose={() => setQrDialogStatement(null)}
        />
      }
    </Sheet>
  );
}