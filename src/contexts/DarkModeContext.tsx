import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { safelyGetStorageItem, safelySetStorageItem } from "../utils/localStorage";

interface DarkModeContextType {
  darkModeOn: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  darkModeOn: false,
  toggleDarkMode: () => {},
});

export function useDarkMode() {
  return useContext(DarkModeContext);
}

interface DarkModeProviderProps {
  children: ReactNode;
}

export function DarkModeProvider({ children }: DarkModeProviderProps) {
  const [darkModeOn, setDarkModeOn] = useState(
    safelyGetStorageItem<boolean>("darkModeOn", false)
  );

  useEffect(() => {
    safelySetStorageItem("darkModeOn", darkModeOn);
  }, [darkModeOn]);

  const toggleDarkMode = () => {
    setDarkModeOn(prev => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ darkModeOn, toggleDarkMode }}>
      <div className={darkModeOn ? "dark" : ""}>
        {children}
      </div>
    </DarkModeContext.Provider>
  );
}

export { DarkModeContext };