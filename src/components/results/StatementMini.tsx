import { motion } from "motion/react";
import { Badge } from "../ui/badge";
import type { Statement } from "../../types";
import { getTypeInfo } from "./utils";

interface StatementMiniProps {
  statement: Statement;
  showVotes?: boolean;
}

export function StatementMini({ statement, showVotes = true }: StatementMiniProps) {
  return (
    <motion.div
      layout
      className="p-3 border rounded-lg bg-card text-sm"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground">Anonymous</span>
        <div className="flex items-center gap-1">
          {statement.type && (
            <Badge variant="secondary" className="text-xs">
              {getTypeInfo(statement.type).label}
            </Badge>
          )}
          {showVotes && (
            <Badge variant="outline" className="text-xs">
              {statement.agrees} agrees
            </Badge>
          )}
        </div>
      </div>
      <p className="leading-relaxed">{statement.text}</p>
    </motion.div>
  );
}
