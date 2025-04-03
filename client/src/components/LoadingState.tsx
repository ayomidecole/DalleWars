import { useState, useEffect } from "react";
import { Palette, Sparkles, Wand2 } from "lucide-react";
import { getDadJokes } from "@/lib/openai";

export default function LoadingState() {
  const [dotCount, setDotCount] = useState(1);
  const [message, setMessage] = useState("Contacting AI");
  const [animationStep, setAnimationStep] = useState(0);
  const [jokeIndex, setJokeIndex] = useState(0);
  const [jokes, setJokes] = useState<string[]>([
    "What's Forrest Gump's Password? 1Forrest1",
    "What Is A Fancy Fish Called? So-Fish-Ti-Cated",
    "I Just Watched A Documentary About Beavers. It Was The Best Dam Show Ever!",
    "Why Don't Scientists Trust Atoms? Because They Make Up Everything!",
    "Why Did The Scarecrow Win An Award? Because He Was Outstanding In His Field!",
    "What Do You Call A Fake Noodle? An Impasta!",
    "How Does A Penguin Build Its House? Igloos It Together!",
    "Did You Hear About The Mathematician Who's Afraid Of Negative Numbers? He'll Stop At Nothing To Avoid Them!"
  ]);
  
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
  
  // Fetch some fresh jokes when component mounts
  useEffect(() => {
    const fetchJokes = async () => {
      try {
        const freshJokes = await getDadJokes(5);
        if (freshJokes && freshJokes.length > 0) {
          // Combine with existing jokes (prefer fresh ones first)
          setJokes(prevJokes => {
            const combined = [...freshJokes, ...prevJokes];
            // Remove duplicates and keep the list at a reasonable size
            return Array.from(new Set(combined)).slice(0, 10);
          });
        }
      } catch (error) {
        console.error("Error fetching jokes:", error);
        // Keep existing jokes if fetch fails
      }
    };
    
    fetchJokes();
  }, []);
  
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
    
    // Rotate dad jokes with timing matched to CSS animation (4.5s)
    const jokeInterval = setInterval(() => {
      setJokeIndex((prev) => (prev + 1) % jokes.length);
    }, 4500);
    
    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
      clearInterval(animationInterval);
      clearInterval(jokeInterval);
    };
  // Icons and messages are static arrays, so we don't need to include them in dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jokes]); // Added jokes as dependency since it can change
  
  const dots = '.'.repeat(dotCount);
  
  return (
    <div className="mb-12 py-16 flex flex-col items-center justify-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-primary to-purple-500 opacity-20 dark:opacity-30 blur-xl animate-pulse"></div>
        <div className="relative bg-white dark:bg-gray-900 rounded-full p-6 shadow-xl border border-gray-100 dark:border-gray-800 dark:shadow-[0_0_15px_rgba(16,163,127,0.2)] transition-all duration-200">
          {icons[animationStep]}
        </div>
      </div>
      
      <div className="space-y-4 text-center">
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200 transition-colors duration-300 dark:neon-text italic min-h-[4rem] flex items-center justify-center">
          "{jokes[jokeIndex] || "Loading jokes..."}"
        </p>
      </div>
      
      <div className="mt-6 flex justify-center space-x-3">
        <div className="h-2 w-2 rounded-full bg-primary dark:bg-primary dark:shadow-[0_0_8px_rgba(16,163,127,0.6)] animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="h-2 w-2 rounded-full bg-primary dark:bg-primary dark:shadow-[0_0_8px_rgba(16,163,127,0.6)] animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="h-2 w-2 rounded-full bg-primary dark:bg-primary dark:shadow-[0_0_8px_rgba(16,163,127,0.6)] animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}
