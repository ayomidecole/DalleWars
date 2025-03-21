import { useState, useEffect } from "react";
import { Palette, Sparkles, Wand2 } from "lucide-react";

export default function LoadingState() {
  const [dotCount, setDotCount] = useState(1);
  const [message, setMessage] = useState("Contacting AI");
  const [animationStep, setAnimationStep] = useState(0);
  
  const messages = [
    "Contacting AI",
    "Analyzing prompt",
    "Gathering inspiration",
    "Creating masterpieces",
    "Finalizing artwork"
  ];

  const icons = [
    <Wand2 key="wand" className="h-7 w-7 text-primary animate-bounce" />,
    <Sparkles key="sparkles" className="h-7 w-7 text-amber-500 animate-pulse" />,
    <Palette key="palette" className="h-7 w-7 text-violet-500 animate-ping opacity-75" />
  ];
  
  useEffect(() => {
    // Animate dots for loading ellipsis
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    
    // Change messages over time
    const messageInterval = setInterval(() => {
      setMessage((prev) => {
        const currentIndex = messages.indexOf(prev);
        return messages[(currentIndex + 1) % messages.length];
      });
    }, 3000);
    
    // Cycle through animation icons
    const animationInterval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % icons.length);
    }, 2000);
    
    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
      clearInterval(animationInterval);
    };
  // Icons and messages are static arrays, so we don't need to include them in dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const dots = '.'.repeat(dotCount);
  
  return (
    <div className="mb-12 py-16 flex flex-col items-center justify-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-primary to-purple-500 opacity-20 dark:opacity-30 blur-xl animate-pulse"></div>
        <div className="relative bg-white dark:bg-gray-900 rounded-full p-6 shadow-xl border border-gray-100 dark:border-gray-800 dark:shadow-[0_0_15px_rgba(16,163,127,0.2)] transition-all duration-200">
          {icons[animationStep]}
        </div>
      </div>
      
      <div className="space-y-2 text-center">
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200 transition-colors duration-200 dark:neon-text">
          {message}<span className="inline-block w-8 text-left">{dots}</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
          Creating both DALL·E 2 and DALL·E 3 versions
        </p>
      </div>
      
      <div className="mt-8 flex justify-center space-x-3">
        <div className="h-2 w-2 rounded-full bg-primary dark:bg-primary dark:shadow-[0_0_8px_rgba(16,163,127,0.6)] animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="h-2 w-2 rounded-full bg-primary dark:bg-primary dark:shadow-[0_0_8px_rgba(16,163,127,0.6)] animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="h-2 w-2 rounded-full bg-primary dark:bg-primary dark:shadow-[0_0_8px_rgba(16,163,127,0.6)] animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}
