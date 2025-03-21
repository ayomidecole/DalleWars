import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { submitVote } from "@/lib/openai";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImagePair } from "@shared/schema";
import { Check, Sparkles } from "lucide-react";
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
        <Card className="neon-card w-full max-w-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/10 pointer-events-none"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="neon-text flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              No Images Yet
            </CardTitle>
            <CardDescription className="text-foreground/80 mt-2">
              Enter a creative prompt above to generate image comparisons between DALL-E 2 and DALL-E 3 models.
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
          <div className="p-4 mb-5 neon-card backdrop-blur-sm">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="neon-text">Prompt:</span> 
              <span className="text-foreground/80 italic">{pair.prompt}</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* DALL-E 2 Image Card */}
            <div className="neon-card overflow-hidden relative group neon-glow">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-zinc-900/20 pointer-events-none"></div>
              <div className="p-4 border-b border-border/30 flex justify-between items-center backdrop-blur-sm relative z-10">
                <h4 className="font-bold text-lg flex items-center">
                  DALL·E 2
                  <div className="ml-2 w-2 h-2 rounded-full bg-zinc-400"></div>
                </h4>
                <span className="text-xs px-3 py-1 bg-zinc-800/50 rounded-full text-zinc-300 font-medium">Legacy Model</span>
              </div>
              
              <div className="p-4 relative z-10">
                <div className="image-card relative overflow-hidden rounded-lg border border-border/50 shadow-inner max-w-xs mx-auto aspect-[4/3] group-hover:shadow-lg transition-shadow duration-500">
                  <img 
                    src={pair.dalle2ImageUrl}
                    alt={`DALL·E 2 generated image for: ${pair.prompt}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>
              
              <div className="px-4 pb-4 pt-2 flex justify-center relative z-10">
                <Button 
                  variant={votedPairs[pair.id] === "dalle2" ? "default" : "outline"}
                  size="default"
                  className={votedPairs[pair.id] === "dalle2" 
                    ? "bg-zinc-800 text-white hover:bg-zinc-700 w-full py-2 text-sm shadow-lg" 
                    : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800/50 hover:text-white w-full py-2 text-sm"}
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
            <div className="neon-card overflow-hidden relative group neon-glow">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/10 pointer-events-none"></div>
              <div className="p-4 border-b border-border/30 flex justify-between items-center backdrop-blur-sm relative z-10">
                <h4 className="font-bold text-lg flex items-center neon-text">
                  DALL·E 3
                  <div className="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </h4>
                <span className="text-xs px-3 py-1 bg-primary/20 rounded-full text-primary font-medium backdrop-blur-md">Latest Model</span>
              </div>
              
              <div className="p-4 relative z-10">
                <div className="image-card relative overflow-hidden rounded-lg border border-primary/30 shadow-lg max-w-xs mx-auto aspect-[4/3] group-hover:shadow-[0_0_15px_rgba(0,255,221,0.15)] transition-all duration-500">
                  <img 
                    src={pair.dalle3ImageUrl}
                    alt={`DALL·E 3 generated image for: ${pair.prompt}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>
              
              <div className="px-4 pb-4 pt-2 flex justify-center relative z-10">
                <Button 
                  variant={votedPairs[pair.id] === "dalle3" ? "default" : "outline"}
                  size="default"
                  className={votedPairs[pair.id] === "dalle3" 
                    ? "neon-button bg-primary/90 text-background hover:bg-primary w-full py-2 text-sm" 
                    : "neon-button hover:text-background w-full py-2 text-sm"}
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
