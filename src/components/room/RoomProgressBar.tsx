interface RoomProgressBarProps {
  total: number;
  completed: number;
}

export function RoomProgressBar({ total, completed }: RoomProgressBarProps) {
  return (
    <div className="flex gap-0.5 px-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{
            backgroundColor:
              i < completed ? "#16a34a" : "rgba(0, 0, 0, 0.15)",
          }}
        />
      ))}
    </div>
  );
}
