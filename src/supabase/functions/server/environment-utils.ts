export const isRunningInProd = (): boolean =>
  Deno.env.get("HEARD_ENV") === "production";

export const getResendApiKeyOnlyInProd = ():
  | string
  | undefined => {
  if (!isRunningInProd()) {
    return undefined;
  }
  return Deno.env.get("RESEND_API_KEY");
};
