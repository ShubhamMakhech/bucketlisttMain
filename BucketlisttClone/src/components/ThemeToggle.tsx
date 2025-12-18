
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./ThemeProvider"

interface ThemeToggleProps {
  className?: string
  variant?: "header" | "default"
  buttonStyles?: string // Accept button styles from parent
}

export function ThemeToggle({ className, variant = "default", buttonStyles }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const getStyles = () => {
    if (variant !== "header") return "hover:bg-accent hover:text-accent-foreground";
    
    // For header variant, use the passed buttonStyles or fallback to default
    if (buttonStyles) {
      return `h-10 w-10 ${buttonStyles}`;
    }
    
    // Fallback styling (should match header button pattern)
    if (theme === "light") {
      return "h-10 w-10 text-gray-900 hover:bg-gray-100/80";
    } else {
      return "h-10 w-10 text-white hover:bg-white/20";
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={`theme-toggle relative ${getStyles()} ${className || ""}`}
    >
      {/* Sun icon */}
      <Sun className={`
        h-[1.2rem] w-[1.2rem] 
        transition-all duration-200 ease-out
        ${theme === 'dark' 
          ? 'rotate-90 scale-0' 
          : 'rotate-0 scale-100'
        }
      `} />
      
      {/* Moon icon */}
      <Moon className={`
        absolute h-[1.2rem] w-[1.2rem]
        transition-all duration-200 ease-out
        ${theme === 'light' 
          ? 'rotate-90 scale-0' 
          : 'rotate-0 scale-100'
        }
      `} />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
