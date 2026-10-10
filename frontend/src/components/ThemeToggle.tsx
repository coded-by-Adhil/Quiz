import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/theme/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : "light";
  const Icon = theme === "light" ? Moon : Sun;

  return (
    <button
      aria-label={`Switch to ${nextTheme} theme`}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition-colors duration-fast ease-standard hover:border-primary hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={toggleTheme}
      title={`Switch to ${nextTheme} theme`}
      type="button"
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
    </button>
  );
}
