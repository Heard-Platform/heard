import type { InputHTMLAttributes } from "react";

const INPUT_STYLE = { borderColor: "#D5D7E0", backgroundColor: "#F7F8FA", color: "#1E2340" };

export function RoundedInput({ className = "", style, ...inputProps }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-2xl border-2 px-4 py-3 text-base outline-none placeholder:text-[#8A8DA0] ${className}`}
      style={{ ...INPUT_STYLE, ...style }}
      {...inputProps}
    />
  );
}
