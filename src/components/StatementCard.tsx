import { motion } from "motion/react";
import {
  CheckCircle,
  XCircle,
  SkipForward,
  MessageCircle,
  Flag,
} from "lucide-react";
import { Button } from "./ui/button";

export interface StatementCardProps {
  statement: {
    id: string;
    text: string;
    author: string;
    agrees: number;
    disagrees: number;
    passes: number;
    type?: "bridge" | "crux" | "plurality";
    isSpicy?: boolean;
    voters?: { [userId: string]: "agree" | "disagree" | "pass" };
  };
  onVote: (id: string, type: "agree" | "disagree" | "pass") => void;
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
  const getTypeColor = () => {
    switch (statement.type) {
      case "bridge":
        return "border-blue-500 bg-blue-50";
      case "crux":
        return "border-red-500 bg-red-50";
      case "plurality":
        return "border-purple-500 bg-purple-50";
      default:
        return "border-border bg-card";
    }
  };

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
      className={`p-4 rounded-lg border-2 transition-all ${getTypeColor()}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            @{statement.author}
          </span>
          {statement.isSpicy && <span className="text-sm">🌶️</span>}
          {getTypeIcon() && (
            <span className="text-sm">{getTypeIcon()}</span>
          )}
        </div>
        {statement.type && (
          <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
            {statement.type.toUpperCase()}
          </span>
        )}
      </div>

      <p className="mb-4 leading-relaxed">{statement.text}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={userVote === "agree" ? "default" : "outline"}
            onClick={() => onVote(statement.id, "agree")}
            disabled={!canVote}
            className="flex items-center gap-1 hover:text-green-700"
            title="Agree"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">
              {statement.agrees > 0 ? statement.agrees : ""}
            </span>
          </Button>
          <Button
            size="sm"
            variant={
              userVote === "disagree" ? "destructive" : "outline"
            }
            onClick={() => onVote(statement.id, "disagree")}
            disabled={!canVote}
            className="flex items-center gap-1 hover:text-red-200"
            title="Disagree"
          >
            <XCircle className="w-4 h-4" />
            <span className="text-sm">
              {statement.disagrees > 0 ? statement.disagrees : ""}
            </span>
          </Button>
          <Button
            size="sm"
            variant={userVote === "pass" ? "secondary" : "outline"}
            onClick={() => onVote(statement.id, "pass")}
            disabled={!canVote}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-700"
            title="Pass"
          >
            <SkipForward className="w-4 h-4" />
            <span className="text-sm">
              {statement.passes > 0 ? statement.passes : ""}
            </span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onFlag(statement.id)}
            className="text-muted-foreground"
          >
            <Flag className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
