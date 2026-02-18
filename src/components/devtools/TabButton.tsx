interface TabButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export function TabButton({ active, label, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 border-b-2 transition-colors ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}
