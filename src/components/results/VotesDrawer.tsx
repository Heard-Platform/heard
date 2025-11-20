import { useState } from "react";
import { motion } from "motion/react";
import { Eye, CheckCircle, XCircle, MinusCircle, Star } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { ScrollArea } from "../ui/scroll-area";
import type { Statement, VoteType } from "../../types";

interface VotesDrawerProps {
  statements: Statement[];
  currentUserId?: string;
  onChangeVote?: (statementId: string, newVote: VoteType) => Promise<void>;
}

export function VotesDrawer({
  statements,
  currentUserId,
  onChangeVote,
}: VotesDrawerProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [changingVoteId, setChangingVoteId] = useState<string | null>(null);

  // Get all statements that have at least one vote
  const statementsWithVotes = statements.filter(
    (s) => s.voters && Object.keys(s.voters).length > 0
  );

  const getUserVote = (statement: Statement): VoteType | null => {
    if (!currentUserId || !statement.voters?.[currentUserId]) return null;
    return statement.voters[currentUserId];
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
    if (!onChangeVote) return;
    setChangingVoteId(statementId);
    try {
      await onChangeVote(statementId, newVote);
    } finally {
      setChangingVoteId(null);
    }
  };

  if (statementsWithVotes.length === 0) {
    return null;
  }

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
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 pr-12 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-left">
            <Eye className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <span>All Votes</span>
          </SheetTitle>
          <SheetDescription className="pt-1">
            <Badge variant="secondary" className="text-xs">
              {statementsWithVotes.length} statements
            </Badge>
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="py-4 space-y-3">
            {statementsWithVotes.map((statement) => {
              const counts = getVoteCounts(statement);
              const userVote = getUserVote(statement);
              const isChanging = changingVoteId === statement.id;

              return (
                <motion.div
                  key={statement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 sm:p-4 bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200 rounded-xl space-y-3"
                >
                  {/* Statement text */}
                  <p className="text-sm leading-relaxed">
                    {statement.text}
                  </p>

                  {/* Vote buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-8 px-2.5 flex items-center gap-1.5 flex-1 ${
                        userVote === "agree"
                          ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
                          : "border-green-300 hover:bg-green-50"
                      }`}
                      onClick={() => currentUserId && onChangeVote && handleChangeVote(statement.id, "agree")}
                      disabled={isChanging || !currentUserId || !onChangeVote}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-sm">{counts.agree}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-8 px-2.5 flex items-center gap-1.5 flex-1 ${
                        userVote === "disagree"
                          ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                          : "border-red-300 hover:bg-red-50"
                      }`}
                      onClick={() => currentUserId && onChangeVote && handleChangeVote(statement.id, "disagree")}
                      disabled={isChanging || !currentUserId || !onChangeVote}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span className="text-sm">{counts.disagree}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-8 px-2.5 flex items-center gap-1.5 flex-1 ${
                        userVote === "super_agree"
                          ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                          : "border-yellow-300 hover:bg-yellow-50"
                      }`}
                      onClick={() => currentUserId && onChangeVote && handleChangeVote(statement.id, "super_agree")}
                      disabled={isChanging || !currentUserId || !onChangeVote}
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span className="text-sm">{counts.super_agree}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-8 px-2.5 flex items-center gap-1.5 flex-1 ${
                        userVote === "pass"
                          ? "bg-gray-500 hover:bg-gray-600 text-white border-gray-500"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => currentUserId && onChangeVote && handleChangeVote(statement.id, "pass")}
                      disabled={isChanging || !currentUserId || !onChangeVote}
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span className="text-sm">{counts.pass}</span>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}