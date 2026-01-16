export const INTRO_SEEN_KEY = "intro_seen";

export const safelySetStorageItem = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to store item "${key}":`, error);
  }
};

export const safelyGetStorageItem = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Failed to retrieve item "${key}":`, error);
    return fallback;
  }
};