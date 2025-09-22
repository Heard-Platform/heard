import { motion } from "motion/react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Flag,
} from "lucide-react";
import { Button } from "./ui/button";

interface StatementCardProps {
  statement: {
    id: string;
    text: string;
    author: string;
    votes: number;
    type?: "bridge" | "crux" | "plurality";
    isSpicy?: boolean;
    voters?: { [userId: string]: "up" | "down" };
  };
  onVote: (id: string, type: "up" | "down") => void;
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
            variant={userVote === "up" ? "default" : "outline"}
            onClick={() => onVote(statement.id, "up")}
            disabled={!canVote}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm">
              {statement.votes > 0 ? statement.votes : ""}
            </span>
          </Button>
          <Button
            size="sm"
            variant={userVote === "down" ? "destructive" : "outline"}
            onClick={() => onVote(statement.id, "down")}
            disabled={!canVote}
          >
            <ThumbsDown className="w-4 h-4" />
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
