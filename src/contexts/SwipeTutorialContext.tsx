import { createContext, useContext, ReactNode } from "react";
import { useSwipeTutorial } from "../hooks/useSwipeTutorial";

type SwipeTutorialContextValue = ReturnType<typeof useSwipeTutorial>;

const SwipeTutorialContext = createContext<SwipeTutorialContextValue | null>(null);

export function SwipeTutorialProvider({ children }: { children: ReactNode }) {
  const value = useSwipeTutorial();
  return (
    <SwipeTutorialContext.Provider value={value}>
      {children}
    </SwipeTutorialContext.Provider>
  );
}

export function useSwipeTutorialContext() {
  const context = useContext(SwipeTutorialContext);
  if (!context) throw new Error("useSwipeTutorialContext must be used within SwipeTutorialProvider");
  return context;
}
