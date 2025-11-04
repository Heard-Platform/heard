import { motion } from "motion/react";
import { Heart, Share2, MessageCircle, Home } from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import type { Statement } from "../../../types";
import { analyzeStatements } from "../utils";
import { CardHeader } from "../CardHeader";

interface ActionsCardProps {
  statements: Statement[];
  onDiscuss?: (statementText: string) => void;
  onShare?: () => void;
  onBackToLobby?: () => void;
}

export function ActionsCard({
  statements,
  onDiscuss,
  onShare,
  onBackToLobby,
}: ActionsCardProps) {
  const analysis = analyzeStatements(statements);

  return (
    <div className="space-y-4">
      <CardHeader
        icon={<Heart className="w-6 h-6 text-pink-500" />}
        title="🎯 Keep The Conversation Going"
        subtitle="What would you like to do next?"
        gradientFrom="from-purple-600"
        gradientTo="to-blue-600"
      />

      <div className="space-y-3">
        {onShare && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Share Results</h3>
                  <p className="text-xs text-muted-foreground">
                    Show others what we discussed
                  </p>
                </div>
              </div>
              <Button onClick={onShare} className="w-full">
                Share Debate
              </Button>
            </Card>
          </motion.div>
        )}

        {onDiscuss && analysis.byAgrees[0] && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Continue Debating</h3>
                  <p className="text-xs text-muted-foreground">
                    Dive deeper into the top statement
                  </p>
                </div>
              </div>
              <Button
                onClick={() => onDiscuss(analysis.byAgrees[0].text)}
                variant="outline"
                className="w-full"
              >
                Discuss "{analysis.byAgrees[0].text.substring(0, 30)}..."
              </Button>
            </Card>
          </motion.div>
        )}

        {onBackToLobby && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Browse Debates</h3>
                  <p className="text-xs text-muted-foreground">
                    Find other active discussions
                  </p>
                </div>
              </div>
              <Button onClick={onBackToLobby} variant="outline" className="w-full">
                Back to Lobby
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
