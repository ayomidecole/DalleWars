import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // Check localStorage first
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    
    // Otherwise check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "light" ? "dark" : "light");
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="relative w-9 h-9 rounded-full transition-colors overflow-hidden group"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === "light" ? (
        <div className="flex items-center justify-center">
          <Sun className="h-5 w-5 text-amber-500 transition-transform hover:scale-110" />
          <span className="sr-only">Switch to dark mode</span>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <Moon className="h-5 w-5 text-blue-400 transition-transform hover:scale-110" />
          <span className="sr-only">Switch to light mode</span>
        </div>
      )}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-r from-blue-400 to-primary dark:from-blue-600 dark:to-purple-600 blur-md"></div>
    </Button>
  );
}