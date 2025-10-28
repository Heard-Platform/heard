// Generic sharing utility for Web Share API with clipboard fallback

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const share = async (options: ShareOptions): Promise<boolean> => {
  const isDesktop = window.innerWidth >= 768;

  if (isDesktop) {
    // Desktop: clipboard only, no fallbacks
    // Use URL if provided, otherwise use text
    const contentToCopy = options.url || options.text || "";
    try {
      await navigator.clipboard.writeText(contentToCopy);
      options?.onSuccess?.();
      return true;
    } catch (error) {
      console.error("Clipboard failed on desktop:", error);
      options?.onError?.(error as Error);
      return false;
    }
  }

  // Mobile: try Web Share API first, then clipboard
  try {
    if (navigator.share) {
      const shareData: ShareData = {};
      
      if (options.title) shareData.title = options.title;
      if (options.text) shareData.text = options.url ? `${options.text} ${options.url}` : options.text;
      if (options.url) shareData.url = options.url;

      // Only use canShare if it exists (it's not available on all browsers)
      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        options?.onSuccess?.();
        return true;
      }
    }
  } catch (shareError) {
    console.log("Web Share API failed, using clipboard fallback:", shareError);
  }

  // Mobile clipboard fallback
  const contentToCopy = options.url || options.text || "";
  try {
    await navigator.clipboard.writeText(contentToCopy);
    options?.onSuccess?.();
    return true;
  } catch (clipboardError) {
    console.error("Clipboard failed on mobile:", clipboardError);
    options?.onError?.(clipboardError as Error);
    return false;
  }
};
