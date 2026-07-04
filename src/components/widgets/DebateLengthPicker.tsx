import { useState } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const PRESETS = [
  { minutes: 10, label: "10m" },
  { minutes: 60, label: "1h" },
  { minutes: 720, label: "12h" },
  { minutes: 1440, label: "24h" },
  { minutes: 4320, label: "3d" },
  { minutes: 10080, label: "7d" },
];

interface DebateLengthPickerProps {
  debateLength: number;
  onDebateLengthChange: (minutes: number) => void;
  variant?: "blue" | "neutral";
  currentEndTime?: number;
}

export function DebateLengthPicker({
  debateLength,
  onDebateLengthChange,
  variant = "neutral",
  currentEndTime,
}: DebateLengthPickerProps) {
  const [showCustomDateTime, setShowCustomDateTime] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");

  const colors = variant === "blue"
    ? {
        icon: "w-5 h-5 text-blue-500",
        label: "text-base text-slate-700",
        helper: "text-xs text-slate-500 text-center",
        primaryButton: "bg-blue-600 hover:bg-blue-700",
        outlineHover: "hover:bg-blue-50",
        card: "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4",
        input: "w-full bg-white border-blue-200",
        link: "text-blue-600 hover:text-blue-700",
      }
    : {
        icon: "w-5 h-5 text-muted-foreground",
        label: "",
        helper: "text-xs text-muted-foreground text-center",
        primaryButton: "",
        outlineHover: "",
        card: "rounded-lg border p-4",
        input: "w-full",
        link: "text-primary hover:underline",
      };

  const handleDateOrTimeChange = (date: string, time: string) => {
    const dateTimeStr = `${date}T${time}`;
    const selectedDate = new Date(dateTimeStr);
    const now = new Date();
    const diffInMinutes = Math.floor((selectedDate.getTime() - now.getTime()) / (1000 * 60));
    if (diffInMinutes > 0) {
      onDebateLengthChange(diffInMinutes);
    }
  };

  const handleDateChange = (date: string) => {
    setCustomDate(date);
    if (date && customTime) {
      handleDateOrTimeChange(date, customTime);
    }
  };

  const handleTimeChange = (time: string) => {
    setCustomTime(time);
    if (customDate && time) {
      handleDateOrTimeChange(customDate, time);
    }
  };

  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const initializeCustomDateTime = () => {
    const lengthInMins = debateLength || 60;
    const lengthInMs = lengthInMins * 60 * 1000;
    const date = new Date(Date.now() + lengthInMs);
    setCustomDate(date.toISOString().split("T")[0]);
    setCustomTime(date.toTimeString().slice(0, 5));
  };

  const isDateTimeInPast = () => {
    if (!customDate || !customTime) return false;
    const dateTimeStr = `${customDate}T${customTime}`;
    const selectedDate = new Date(dateTimeStr);
    const now = new Date();
    return selectedDate.getTime() <= now.getTime();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className={colors.icon} />
        <Label className={colors.label}>Length</Label>
      </div>

      <p className={colors.helper}>How long should this run before closing?</p>

      {currentEndTime && (
        <p className={colors.helper}>
          Currently ends{" "}
          {new Date(currentEndTime).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {PRESETS.map(({ minutes, label }) => (
          <Button
            key={minutes}
            type="button"
            variant={debateLength === minutes ? "default" : "outline"}
            onClick={() => {
              onDebateLengthChange(minutes);
              setShowCustomDateTime(false);
            }}
            className={debateLength === minutes ? colors.primaryButton : colors.outlineHover}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setShowCustomDateTime(!showCustomDateTime);
            if (!showCustomDateTime) {
              initializeCustomDateTime();
            }
          }}
          className={`text-sm underline ${colors.link}`}
        >
          {showCustomDateTime ? "Hide custom date" : "Set custom end date"}
        </button>
      </div>

      {showCustomDateTime && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className={colors.card}>
            <div className="space-y-3">
              <div>
                <Label htmlFor="custom-date" className="text-sm block mb-2">
                  Date
                </Label>
                <Input
                  type="date"
                  id="custom-date"
                  min={getMinDate()}
                  value={customDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={colors.input}
                />
              </div>
              <div>
                <Label htmlFor="custom-time" className="text-sm block mb-2">
                  Time
                </Label>
                <Input
                  type="time"
                  id="custom-time"
                  value={customTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className={colors.input}
                />
              </div>
              {isDateTimeInPast() && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">
                    The selected date and time is in the past. Please choose a future date and time.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
