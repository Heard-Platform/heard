import { useEffect, useState } from "react";
import { safelyGetStorageItem, safelySetStorageItem } from "../utils/localStorage";

const SHOW_VIDEO_STORAGE_KEY = "youtubeAudioEmbed.showVideo";

let showVideoValue = safelyGetStorageItem(SHOW_VIDEO_STORAGE_KEY, false);
const showVideoListeners = new Set<(value: boolean) => void>();

function setShowVideoValue(value: boolean) {
  showVideoValue = value;
  safelySetStorageItem(SHOW_VIDEO_STORAGE_KEY, value);
  showVideoListeners.forEach((listener) => listener(value));
}

export function useShowVideoSetting(): [boolean, () => void] {
  const [value, setValue] = useState(showVideoValue);

  useEffect(() => {
    showVideoListeners.add(setValue);
    return () => {
      showVideoListeners.delete(setValue);
    };
  }, []);

  const toggle = () => setShowVideoValue(!showVideoValue);

  return [value, toggle];
}
