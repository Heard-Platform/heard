interface TOSTextProps {
  prefix?: string;
}

export function TOSText({ prefix }: TOSTextProps) {
  return (
    <p className="text-xs text-muted-foreground">
      {prefix}By using Heard, you agree to our{" "}
      <a
        href="/terms"
        className="heard-link underline"
      >
        Terms of Service
      </a>
      {" "}and{" "}
      <a
        href="/privacy"
        className="heard-link underline"
      >
        Privacy Policy
      </a>
    </p>
  );
}