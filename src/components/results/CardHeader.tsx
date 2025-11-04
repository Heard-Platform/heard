import { motion } from "motion/react";
import { ReactNode } from "react";

interface CardHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
}

export function CardHeader({
  icon,
  title,
  subtitle,
  gradientFrom,
  gradientTo,
}: CardHeaderProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-center space-y-2"
    >
      <h2
        className={`flex items-center justify-center gap-2 bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}
      >
        {icon}
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}
