import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { Statement } from "../../types";
import { getTypeInfo } from "./utils";

interface StatementMiniProps {
  statement: Statement;
  showVotes?: boolean;
  onDiscuss?: (statementText: string) => void;
}

export function StatementMini({ statement, showVotes = true, onDiscuss }: StatementMiniProps) {
  const { t } = useTranslation("results");
  return (
    <motion.div
      layout
      className="p-3 border rounded-lg bg-card text-sm space-y-2"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-muted-foreground">{t("anonymous")}</span>
        <div className="flex items-center gap-1">
          {statement.type && (
            <Badge variant="secondary" className="text-xs">
              {t(getTypeInfo(statement.type).labelKey)}
            </Badge>
          )}
          {showVotes && (
            <Badge variant="outline" className="text-xs">
              {t("agreeCount", { count: statement.agrees })}
            </Badge>
          )}
        </div>
      </div>
      <p className="leading-relaxed">{statement.text}</p>
      {onDiscuss && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs gap-1"
          onClick={() => onDiscuss(statement.text)}
        >
          <MessageCircle className="w-3 h-3" />
          {t("discussThis")}
        </Button>
      )}
    </motion.div>
  );
}
