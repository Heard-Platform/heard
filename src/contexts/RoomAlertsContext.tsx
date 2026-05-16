import { createContext, useContext, ReactNode } from "react";
import { useRoomAlerts, type RoomAlertsState } from "../hooks/useRoomAlerts";

const RoomAlertsContext = createContext<RoomAlertsState | null>(null);

export function RoomAlertsProvider({ children }: { children: ReactNode }) {
  const value = useRoomAlerts();
  return (
    <RoomAlertsContext.Provider value={value}>
      {children}
    </RoomAlertsContext.Provider>
  );
}

export function useRoomAlertsContext(): RoomAlertsState {
  const context = useContext(RoomAlertsContext);
  if (!context) {
    throw new Error(
      "useRoomAlertsContext must be used within a RoomAlertsProvider",
    );
  }
  return context;
}
