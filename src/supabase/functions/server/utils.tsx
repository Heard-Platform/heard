export const generateId = () =>
  Math.random().toString(36).substring(2) +
  Date.now().toString(36);

export const getFrontendUrl = (): string => {
  return (
    Deno.env.get("FRONTEND_URL") || "https://heard-now.com"
  );
};