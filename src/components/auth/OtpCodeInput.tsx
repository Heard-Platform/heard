import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

interface OtpCodeInputProps {
  value: string;
  slotClassName?: string;
  onChange: (value: string) => void;
}

export function OtpCodeInput({ value, slotClassName, onChange }: OtpCodeInputProps) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      pattern="^[A-Za-z0-9]+$"
      inputMode="text"
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }).map((_, i) => (
          <InputOTPSlot key={i} index={i} className={slotClassName} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
