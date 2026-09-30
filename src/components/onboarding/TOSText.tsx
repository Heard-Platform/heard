interface TOSTextProps {
  prefix?: string;
  className?: string;
  linkClassName?: string;
}

export function TOSText({
  prefix,
  className = "text-xs text-muted-foreground",
  linkClassName = "heard-link underline",
}: TOSTextProps) {
  return (
    <p className={className}>
      {prefix}By using Heard, you agree to our{" "}
      <a
        href="/terms"
        className={linkClassName}
      >
        Terms of Service
      </a>
      {" "}and{" "}
      <a
        href="/privacy"
        className={linkClassName}
      >
        Privacy Policy
      </a>
    </p>
  );
}
