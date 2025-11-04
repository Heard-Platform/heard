import { motion } from "motion/react";
import { ReactNode } from "react";

interface AwardCardProps {
  emoji: string;
  title: string;
  value: number | string;
  text: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  textColor: string;
  valueColor: string;
  delay?: number;
  showShimmer?: boolean;
}

export function AwardCard({
  emoji,
  title,
  value,
  text,
  gradientFrom,
  gradientTo,
  borderColor,
  textColor,
  valueColor,
  delay = 0,
  showShimmer = false,
}: AwardCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05 }}
      className="relative"
    >
      <div
        className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} border-2 ${borderColor} rounded-lg p-4 space-y-2`}
      >
        {showShimmer && (
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${gradientFrom.replace("from-", "from-").replace("-50", "-300/20")} ${gradientTo.replace("to-", "to-").replace("-100", "-300/20")} rounded-lg`}
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
        <div className="relative z-10">
          <div className="text-3xl mb-1">{emoji}</div>
          <div
            className={`text-xs font-medium ${textColor} mb-1`}
          >
            {title}
          </div>
          <div
            className={`text-2xl font-bold ${valueColor} mb-2`}
          >
            {value}
          </div>
          <p className="text-xs line-clamp-2">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}