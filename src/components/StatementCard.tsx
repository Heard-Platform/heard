import { motion } from "motion/react";
import {
  CheckCircle,
  XCircle,
  Ban,
  MessageCircle,
  Flag,
} from "lucide-react";
import { Button } from "./ui/button";
import type { Statement } from "../types";
import { getPastelColor } from "../utils/colors";

export interface StatementCardProps {
  statement: Statement;
  onVote: (
    id: string,
    type: "agree" | "disagree" | "pass",
  ) => void;
  onFlag: (id: string) => void;
  canVote: boolean;
  currentUserId?: string;
}

export function StatementCard({
  statement,
  onVote,
  onFlag,
  canVote,
  currentUserId,
}: StatementCardProps) {
  const userVote = currentUserId
    ? statement.voters?.[currentUserId]
    : null;
  const userHasVoted = !!userVote;

  const getTypeIcon = () => {
    switch (statement.type) {
      case "bridge":
        return "🌉";
      case "crux":
        return "⚡";
      case "plurality":
        return "💎";
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`p-4 rounded-lg border-2 transition-all ${getPastelColor(statement.id)}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Anonymous
          </span>
          {statement.isSpicy && (
            <span className="text-sm">🌶️</span>
          )}
          {getTypeIcon() && (
            <span className="text-sm">{getTypeIcon()}</span>
          )}
          {statement.type && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
              {statement.type.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              alert("Flag feature is not implemented yet. This will allow you to report inappropriate content.");
            }}
            className="text-muted-foreground p-2"
          >
            <Flag className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="p-2"
            onClick={() => {
              alert("Comment feature is not implemented yet. This will allow you to discuss specific statements.");
            }}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="mb-4 leading-relaxed">{statement.text}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={
            userVote === "agree" ? "default" : "outline"
          }
          onClick={() => onVote(statement.id, "agree")}
          disabled={!canVote}
          className={`flex items-center gap-1.5 ${
            userVote === "agree"
              ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
              : "text-green-600 hover:text-green-700 hover:bg-green-50"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Agree</span>
          {userHasVoted && statement.agrees > 0 && (
            <span className="text-sm">({statement.agrees})</span>
          )}
        </Button>
        <Button
          size="sm"
          variant={
            userVote === "disagree"
              ? "destructive"
              : "outline"
          }
          onClick={() => onVote(statement.id, "disagree")}
          disabled={!canVote}
          className={`flex items-center gap-1.5 hover:text-red-200 ${
            userVote === "disagree"
              ? "text-white"
              : "text-red-600"
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Disagree</span>
          {userHasVoted && statement.disagrees > 0 && (
            <span className="text-sm">({statement.disagrees})</span>
          )}
        </Button>
        <Button
          size="sm"
          variant={
            userVote === "pass" ? "secondary" : "outline"
          }
          onClick={() => onVote(statement.id, "pass")}
          disabled={!canVote}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-700"
        >
          <Ban className="w-4 h-4" />
          <span>Pass</span>
          {userHasVoted && statement.passes > 0 && (
            <span className="text-sm">({statement.passes})</span>
          )}
        </Button>
      </div>
    </motion.div>
  );
}