import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { submitVote } from "@/lib/openai";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImagePair } from "@shared/schema";
import { Check } from "lucide-react";
import EmptyState from "./EmptyState";

interface ImageComparisonProps {
  loading: boolean;
  imagePair: ImagePair | null;
}

export default function ImageComparison({ loading, imagePair }: ImageComparisonProps) {
  const { toast } = useToast();
  const [votedPairs, setVotedPairs] = useState<Record<number, "dalle2" | "dalle3">>({}); 
  
  // Load saved votes from localStorage on component mount
  useEffect(() => {
    const savedVotes = localStorage.getItem('votedPairs');
    if (savedVotes) {
      try {
        const parsedVotes = JSON.parse(savedVotes);
        setVotedPairs(parsedVotes);
      } catch (error) {
        console.error('Failed to parse saved votes:', error);
      }
    }
  }, []);
  
  const voteMutation = useMutation({
    mutationFn: ({ imagePairId, votedForDalle3 }: { imagePairId: number; votedForDalle3: boolean }) => 
      submitVote(imagePairId, votedForDalle3),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/scores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/latest-image-pair'] });
      
      // Update state and save to localStorage
      const newVotedPairs = {
        ...votedPairs,
        [variables.imagePairId]: variables.votedForDalle3 ? "dalle3" : "dalle2"
      } as Record<number, "dalle2" | "dalle3">;
      setVotedPairs(newVotedPairs);
      localStorage.setItem('votedPairs', JSON.stringify(newVotedPairs));
      
      toast({
        title: "Vote recorded",
        description: "Thank you for your vote!",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit your vote.";
      
      // If the error is about already voted, update the local state
      if (error instanceof Error && 
          (errorMessage.toLowerCase().includes('already voted'))) {
        
        // Get the image pair ID and vote from the current mutation
        const imagePairId = voteMutation.variables?.imagePairId;
        const votedForDalle3 = voteMutation.variables?.votedForDalle3;
        
        if (imagePairId !== undefined) {
          // Update local state to mark this pair as voted
          const newVotedPairs = {
            ...votedPairs,
            [imagePairId]: votedForDalle3 ? "dalle3" : "dalle2"
          } as Record<number, "dalle2" | "dalle3">;
          setVotedPairs(newVotedPairs);
          localStorage.setItem('votedPairs', JSON.stringify(newVotedPairs));
          
          // Show a more friendly toast message
          toast({
            title: "Already voted",
            description: "You have already voted for this image pair.",
            variant: "default",
          });
          return;
        }
      }
      
      // Show error toast for other errors
      toast({
        title: "Vote failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
  
  const handleVote = (imagePairId: number, votedForDalle3: boolean) => {
    voteMutation.mutate({ imagePairId, votedForDalle3 });
  };
  
  if (loading) {
    return null;
  }
  
  if (!loading && !imagePair) {
    return (
      <div className="flex justify-center my-8">
        <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 transition-all duration-300 dark:card-glow hover:dark:border-glow group">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-200 transition-colors dark:heading-glow dark:multi-glow">No Images Yet</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 transition-all duration-300 dark:group-hover:text-gray-300">
              Enter a prompt above to generate image comparisons from DALL-E 2 and DALL-E 3.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // At this point we've confirmed imagePair exists
  const pair = imagePair!;
  
  return (
    <section id="imagesComparison" className="my-8">
      <div className="mb-10">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 mb-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 dark:card-glow hover:dark:border-glow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 transition-colors dark:heading-glow">
              Prompt: <span className="text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 dark:text-shadow-glow">{pair.prompt}</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DALL-E 2 Image Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-md dark:shadow-none overflow-hidden transition-all duration-300 dark:card-glow group">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-800/50 transition-colors">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg transition-colors dark:heading-glow model-name">DALL·E 2</h4>
                <span className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-300 font-semibold transition-colors">Legacy Model</span>
              </div>
              
              <div className="p-4">
                <div className="image-card relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm max-w-xs mx-auto aspect-[4/3] transition-all cursor-pointer">
                  <img 
                    src={pair.dalle2ImageUrl}
                    alt={`DALL·E 2 generated image for: ${pair.prompt}`}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-105"
                  />
                </div>
              </div>
              
              <div className="px-4 pb-4 pt-2 flex justify-center">
                <Button 
                  variant={votedPairs[pair.id] === "dalle2" ? "default" : "outline"}
                  size="default"
                  className={votedPairs[pair.id] === "dalle2" 
                    ? "bg-gray-800 text-white hover:bg-gray-700 w-full py-2 text-sm dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300 dark:shadow-[0_0_10px_rgba(255,255,255,0.2)] vote-button" 
                    : "border-2 border-gray-800 text-gray-800 font-medium hover:bg-gray-800 hover:text-white w-full py-2 text-sm dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300 dark:group-hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] vote-button"}
                  onClick={() => handleVote(pair.id, false)}
                  disabled={!!votedPairs[pair.id]}
                >
                  {votedPairs[pair.id] === "dalle2" ? (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Vote Recorded
                    </>
                  ) : (
                    "Vote for DALL·E 2"
                  )}
                </Button>
              </div>
            </div>
            
            {/* DALL-E 3 Image Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-md dark:shadow-none overflow-hidden transition-all duration-300 dark:card-glow group">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-green-950/30 transition-colors">
                <h4 className="font-bold text-gray-800 dark:text-green-100 text-lg transition-all duration-300 dark:heading-glow model-name dark:text-shadow-glow">DALL·E 3</h4>
                <span className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/50 rounded-full text-green-800 dark:text-green-400 font-semibold transition-colors dark:border-glow">Latest Model</span>
              </div>
              
              <div className="p-4">
                <div className="image-card relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm max-w-xs mx-auto aspect-[4/3] transition-all cursor-pointer">
                  <img 
                    src={pair.dalle3ImageUrl}
                    alt={`DALL·E 3 generated image for: ${pair.prompt}`}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-105"
                  />
                </div>
              </div>
              
              <div className="px-4 pb-4 pt-2 flex justify-center">
                <Button 
                  variant={votedPairs[pair.id] === "dalle3" ? "default" : "outline"}
                  size="default"
                  className={votedPairs[pair.id] === "dalle3" 
                    ? "bg-primary text-white hover:bg-primary/90 w-full py-2 text-sm dark:btn-primary transition-all duration-300 dark:shadow-[0_0_15px_rgba(16,163,127,0.3)] vote-button" 
                    : "border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white w-full py-2 text-sm dark:border-primary/80 dark:text-primary/90 dark:hover:bg-primary/80 transition-all duration-300 dark:group-hover:shadow-[0_0_18px_rgba(16,163,127,0.35)] vote-button"}
                  onClick={() => handleVote(pair.id, true)}
                  disabled={!!votedPairs[pair.id]}
                >
                  {votedPairs[pair.id] === "dalle3" ? (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Vote Recorded
                    </>
                  ) : (
                    "Vote for DALL·E 3"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
