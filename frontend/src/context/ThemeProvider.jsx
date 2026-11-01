import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContext";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("pagasa-theme");
  if (["light", "dark"].includes(savedTheme)) return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pagasa-theme", theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
