import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { safelyGetStorageItem } from "../utils/localStorage";

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export function useDarkMode() {
  return useContext(DarkModeContext);
}

interface DarkModeProviderProps {
  children: ReactNode;
}

export function DarkModeProvider({ children }: DarkModeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(
    safelyGetStorageItem<boolean>("darkMode", false)
  );

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <div className={isDarkMode ? "dark" : ""}>
        {children}
      </div>
    </DarkModeContext.Provider>
  );
}

export { DarkModeContext };