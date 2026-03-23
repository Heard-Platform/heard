export function TOSText() {
  return (
    <p className="text-xs text-muted-foreground">
      By using Heard, you agree to our{" "}
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