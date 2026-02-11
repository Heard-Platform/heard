import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Compass } from "lucide-react";
import { FeatureFlags, isFeatureEnabled } from "../utils/constants/feature-flags";

interface CreateRoomCardProps {
  onCreateRoom: () => void;
  onOpenExplorer: () => void;
}

export function CreateRoomCard({
  onCreateRoom,
  onOpenExplorer,
}: CreateRoomCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 border-2 border-green-200 shadow-2xl">
        <div className="p-8 space-y-6 text-center flex flex-col items-center justify-center min-h-[500px]">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
          >
            <Plus className="w-12 h-12 text-white" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Start a New Conversation
            </h2>
            <p className="text-muted-foreground">
              Create your own room and invite others to join the
              discussion
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-md">
            <Button
              onClick={onCreateRoom}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg py-6 px-8"
            >
              Create New Room
              <Plus className="w-5 h-5 ml-2" />
            </Button>
            
            {isFeatureEnabled(FeatureFlags.ONLY_JOINED_COMMUNITIES) && 
              <Button
                onClick={onOpenExplorer}
                size="lg"
                variant="outline"
                className="border-2 border-green-500 text-green-700 hover:bg-green-50 text-lg py-6 px-8"
              >
                Join New Communities
                <Compass className="w-5 h-5 ml-2" />
              </Button>
            }
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
