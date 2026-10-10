import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { ThemeContext } from "@/theme/context";

export type Theme = "light" | "dark";

const themeStorageKey = "quiz_platform_theme";

function getInitialTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey);

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // The theme remains active for this session when storage is unavailable.
    }
  }, [theme]);

  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((currentTheme) =>
        currentTheme === "light" ? "dark" : "light",
      ),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
