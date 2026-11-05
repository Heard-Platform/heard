import { useCallback, useEffect, useState } from "react";
import type {
  NewsletterContent,
  SavedNewsletter,
} from "../../../types";
import { adminApi } from "../../../utils/admin-api";
import { LAST_HAND_CODED_NEWSLETTER_EDITION } from "./newsletter-editions";

export function useSavedNewsletters(adminKey: string) {
  const [savedNewsletters, setSavedNewsletters] = useState<
    SavedNewsletter[]
  >([]);
  const [nextEditionNumber, setNextEditionNumber] = useState(
    LAST_HAND_CODED_NEWSLETTER_EDITION + 1,
  );
  const [hasLoadedSavedNewsletters, setHasLoadedSavedNewsletters] =
    useState(false);

  const loadSavedNewsletters = useCallback(async () => {
    const response = await adminApi.listNewsletters(adminKey);
    if (!response.success || !response.data) {
      console.error("Error loading newsletters:", response.error);
      return;
    }
    setSavedNewsletters(response.data.newsletters);
    setNextEditionNumber(response.data.nextEditionNumber);
    setHasLoadedSavedNewsletters(true);
  }, [adminKey]);

  useEffect(() => {
    loadSavedNewsletters();
  }, [loadSavedNewsletters]);

  const saveNewsletter = async (newsletter: NewsletterContent) => {
    const response = await adminApi.saveNewsletter(
      adminKey,
      newsletter,
    );
    if (!response.success) {
      throw new Error(response.error || "Failed to save newsletter");
    }
    await loadSavedNewsletters();
  };

  const uploadNewsletterImage = async (
    editionNumber: number,
    imageFile: File,
  ) => {
    const response = await adminApi.uploadNewsletterImage(
      adminKey,
      editionNumber,
      imageFile,
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to upload image");
    }
    return response.data.imageUrl;
  };

  return {
    savedNewsletters,
    nextEditionNumber,
    hasLoadedSavedNewsletters,
    loadSavedNewsletters,
    saveNewsletter,
    uploadNewsletterImage,
  };
}
