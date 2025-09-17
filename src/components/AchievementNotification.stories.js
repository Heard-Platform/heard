import { AchievementNotification } from "./AchievementNotification";

export default {
  title: "Components/AchievementNotification",
  component: AchievementNotification,
  parameters: {
    layout: "centered",
  },
};

const sampleAchievement = {
  type: "streak",
  title: "Hot Streak!",
  description: "You won 3 rounds in a row!",
  icon: "flame",
};

export const Default = {
  args: {
    achievement: sampleAchievement,
    onClose: () => {},
  },
};
