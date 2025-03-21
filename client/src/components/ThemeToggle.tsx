import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeType = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeType>(() => {
    // Check if running in browser
    if (typeof window === "undefined") return "system";
    
    // Check localStorage first
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored as ThemeType;
    }
    
    // Default to system
    return "system";
  });

  // Apply the theme to document based on preference
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Handle system preference changes
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        if (e.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };
    
    // Apply theme
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      // System preference
      localStorage.setItem("theme", "system");
      if (mediaQuery.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    
    // Listen for system preference changes
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  // Get the current icon based on theme
  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5 text-amber-500 transition-transform hover:scale-110" />;
      case "dark":
        return <Moon className="h-5 w-5 text-blue-400 transition-transform hover:scale-110" />;
      case "system":
        return <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-400 transition-transform hover:scale-110" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9 rounded-full transition-colors overflow-hidden group"
          aria-label="Change theme"
        >
          <div className="flex items-center justify-center">
            {getThemeIcon()}
          </div>
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-r from-blue-400 to-primary dark:from-blue-600 dark:to-purple-600 blur-md"></div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
          <Sun className="h-4 w-4 mr-2 text-amber-500" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
          <Moon className="h-4 w-4 mr-2 text-blue-400" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
          <Monitor className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}