import { motion } from "motion/react";
import { Flame, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import type { Statement } from "../../../types";
import { analyzeStatements } from "../utils";
import { CardHeader } from "../CardHeader";

interface ControversialCardProps {
  statements: Statement[];
  onDiscuss?: (statementText: string) => void;
}

export function ControversialCard({
  statements,
  onDiscuss,
}: ControversialCardProps) {
  const { t } = useTranslation("results");
  const analysis = analyzeStatements(statements);

  return (
    <div className="space-y-4">
      <CardHeader
        icon={<Flame className="w-6 h-6 text-orange-500" />}
        title={t("spicyTakesTitle")}
        subtitle={t("spicyTakesSubtitle")}
        gradientFrom="from-orange-600"
        gradientTo="to-red-600"
      />

      <div className="space-y-3">
        {analysis.controversial.slice(0, 3).map((statement, index) => (
          <motion.div
            key={statement.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg space-y-3"
          >
            <div className="flex items-start gap-2">
              <Flame className="w-5 h-5 text-orange-500 mt-1 shrink-0" />
              <p className="text-sm">{statement.text}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="heard-between text-xs">
                  <span className="text-green-600 font-medium">
                    {t("agreedCount", { count: statement.agrees })}
                  </span>
                  <span className="text-red-600 font-medium">
                    {t("disagreedCount", { count: statement.disagrees })}
                  </span>
                </div>
                <Progress
                  value={
                    (statement.agrees /
                      (statement.agrees + statement.disagrees)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>
            {onDiscuss && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onDiscuss(statement.text)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {t("discussThis")}
              </Button>
            )}
          </motion.div>
        ))}
        {analysis.controversial.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {t("noControversial")}
          </p>
        )}
      </div>
    </div>
  );
}