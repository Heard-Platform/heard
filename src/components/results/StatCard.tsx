import { motion } from "motion/react";

interface StatCardProps {
  value: number;
  label: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  textColor: string;
  delay?: number;
}

export function StatCard({
  value,
  label,
  gradientFrom,
  gradientTo,
  borderColor,
  textColor,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay, type: "spring" }}
      whileHover={{ scale: 1.05 }}
      className={`p-4 bg-gradient-to-br ${gradientFrom} ${gradientTo} border-2 ${borderColor} rounded-lg text-center space-y-2`}
    >
      <div className={`text-3xl font-mono ${textColor}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}
