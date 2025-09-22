import { fn } from "storybook/test";
import { DebateTimer } from "../components/DebateTimer";

export default {
  title: "Components/DebateTimer",
  component: DebateTimer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    duration: { control: "number" },
    isActive: { control: "boolean" },
    onTimeUp: { action: "timeUp" },
  },
  args: { onTimeUp: fn() },
};

export const Default = {
  args: {
    duration: 60,
    isActive: true,
  },
};

export const Paused = {
  args: {
    duration: 60,
    isActive: false,
  },
};

export const Urgent = {
  args: {
    duration: 10,
    isActive: true,
  },
};
