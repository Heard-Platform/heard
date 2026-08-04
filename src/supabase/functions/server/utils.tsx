export const normalizeCommunityName = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, "-");

export const generateId = () =>
  Math.random().toString(36).substring(2) +
  Date.now().toString(36);

export const getFrontendUrl = (): string => {
  return (
    Deno.env.get("FRONTEND_URL") || "https://heard.vote"
  );
};

const EMAIL_MASK = "••••";

export function obfuscateEmail(email: string): string {
  const at = email.indexOf("@");
  if (at === -1) return `${EMAIL_MASK}@${EMAIL_MASK}`;
  const visible = email.slice(0, at).slice(0, 6);
  return `${visible}${EMAIL_MASK}@${EMAIL_MASK}`;
}

const PHONE_MASK = "•••-•••-";

export function obfuscatePhone(phone: string): string {
  if (phone.length < 4) return `${PHONE_MASK}••••`;
  return `${PHONE_MASK}${phone.slice(-4)}`;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}