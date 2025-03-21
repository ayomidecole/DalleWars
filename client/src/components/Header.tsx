import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-border/30 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-5 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold flex items-center relative group">
            <div className="absolute -inset-x-4 -inset-y-2 rounded-lg bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <span className="text-primary font-extrabold relative">
              DALL·E
              <Sparkles className="h-5 w-5 absolute -top-1 -right-6 text-primary animate-pulse" />
            </span>
            <span className="text-foreground relative ml-2 flex items-center">
              Wars
              <div className="h-px w-full absolute -bottom-1 left-0 bg-gradient-to-r from-primary via-purple-500 to-transparent"></div>
            </span>
          </h1>
        </div>
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-primary to-purple-600 before:absolute before:inset-0 before:animate-spin before:bg-gradient-to-r before:from-transparent before:to-white/20 before:duration-1000"></div>
      </div>
    </header>
  );
}
