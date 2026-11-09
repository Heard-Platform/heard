import { motion } from "motion/react";
import {
  DisplayCenteredScreen,
  DisplayEyebrow,
  DisplayQr,
} from "./DisplayParts";

interface DisplayPromptIntroProps {
  eyebrow: string;
  prompt: string;
  joinUrl: string;
  joinLabel: string;
}

export function DisplayPromptIntro({
  eyebrow,
  prompt,
  joinUrl,
  joinLabel,
}: DisplayPromptIntroProps) {
  return (
    <DisplayCenteredScreen>
      <DisplayEyebrow>{eyebrow}</DisplayEyebrow>
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-[80cqw] text-[5.2cqw] font-extrabold leading-[1.1] tracking-tight text-balance"
      >
        {prompt}
      </motion.h1>
      <div className="absolute bottom-[2.4cqw] left-[3.6cqw]">
        <DisplayQr
          joinUrl={joinUrl}
          caption={joinLabel}
          className="w-[7cqw]"
        />
      </div>
    </DisplayCenteredScreen>
  );
}
