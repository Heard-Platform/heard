// Generic sharing utility for Web Share API with clipboard fallback

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const copyToClipboard = (text: string): Promise<void> => {
  return navigator.clipboard.writeText(text);
};

export const share = async (options: ShareOptions): Promise<boolean> => {
  // Try Web Share API first, then fall back to clipboard
  try {
    if (navigator.share) {
      const shareData: ShareData = {};
      if (options.title) shareData.title = options.title;
      if (options.text) shareData.text = options.text;
      if (options.url) shareData.url = options.url;

      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        options?.onSuccess?.();
        return true;
      }
    }
  } catch (shareError) {
    if ((shareError as Error)?.name === "AbortError") {
      return false;
    }
    console.log("Web Share API failed, using clipboard fallback:", shareError);
  }

  const parts = [options.title, options.text];
  if (options.url && !options.text?.includes(options.url)) parts.push(options.url);
  const contentToCopy = parts.filter(Boolean).join("\n\n");

  try {
    await copyToClipboard(contentToCopy);
    options?.onSuccess?.();
    return true;
  } catch (clipboardError) {
    console.error("Clipboard failed:", clipboardError);
    options?.onError?.(clipboardError as Error);
    return false;
  }
};
