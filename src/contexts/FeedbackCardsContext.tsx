import { createContext, useContext, ReactNode } from "react";
import { useFeedbackCards } from "../hooks/useFeedbackCards";

type FeedbackCardsContextValue = ReturnType<typeof useFeedbackCards>;

const FeedbackCardsContext = createContext<FeedbackCardsContextValue | null>(null);

export function FeedbackCardsProvider({ children }: { children: ReactNode }) {
  const value = useFeedbackCards();
  return (
    <FeedbackCardsContext.Provider value={value}>
      {children}
    </FeedbackCardsContext.Provider>
  );
}

export function useFeedbackCardsContext() {
  const context = useContext(FeedbackCardsContext);
  if (!context) throw new Error("useFeedbackCardsContext must be used within FeedbackCardsProvider");
  return context;
}
