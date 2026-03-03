export function TOSText() {
  return (
    <p className="text-xs text-center text-muted-foreground">
      By using Heard, you agree to our{" "}
      <a
        href="/terms"
        className="text-purple-600 hover:text-purple-700 underline"
      >
        Terms of Service
      </a>
      {" "}and{" "}
      <a
        href="/privacy"
        className="text-purple-600 hover:text-purple-700 underline"
      >
        Privacy Policy
      </a>
    </p>
  );
}