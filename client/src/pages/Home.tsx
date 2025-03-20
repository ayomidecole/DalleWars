import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromptForm from "@/components/PromptForm";
import ScoreDisplay from "@/components/ScoreDisplay";
import ImageComparison from "@/components/ImageComparison";
import LoadingState from "@/components/LoadingState";

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateStart = () => {
    setIsGenerating(true);
  };
  
  const handleGenerateComplete = () => {
    setIsGenerating(false);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <PromptForm 
          onGenerateStart={handleGenerateStart} 
          onGenerateComplete={handleGenerateComplete} 
        />
        
        <ScoreDisplay />
        
        {isGenerating ? (
          <LoadingState />
        ) : (
          <ImageComparison loading={isGenerating} />
        )}
      </main>
      
      <Footer />
    </div>
  );
}
