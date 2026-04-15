export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned;
};

export const hasDuplicates = (value: string, allValues: string[]): boolean => {
  const trimmedValue = value.trim().toLowerCase();
  return (
    trimmedValue !== "" &&
    allValues.filter((v) => v.trim().toLowerCase() === trimmedValue).length > 1
  );
}