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
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>No Images Yet</CardTitle>
            <CardDescription>
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
          <div className="p-4 mb-5 bg-gray-100 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">
              Prompt: <span className="text-gray-700 font-medium">{pair.prompt}</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DALL-E 2 Image Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h4 className="font-bold text-gray-800 text-lg">DALL·E 2</h4>
                <span className="text-xs px-3 py-1 bg-gray-200 rounded-full text-gray-800 font-semibold">Legacy Model</span>
              </div>
              
              <div className="p-4">
                <div className="image-card relative overflow-hidden rounded-lg border border-gray-200 shadow-sm max-w-xs mx-auto aspect-[4/3]">
                  <img 
                    src={pair.dalle2ImageUrl}
                    alt={`DALL·E 2 generated image for: ${pair.prompt}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="px-4 pb-4 pt-2 flex justify-center">
                <Button 
                  variant={votedPairs[pair.id] === "dalle2" ? "default" : "outline"}
                  size="default"
                  className={votedPairs[pair.id] === "dalle2" 
                    ? "bg-gray-800 text-white hover:bg-gray-700 w-full py-2 text-sm" 
                    : "border-2 border-gray-800 text-gray-800 font-medium hover:bg-gray-800 hover:text-white w-full py-2 text-sm"}
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
            <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-green-50">
                <h4 className="font-bold text-gray-800 text-lg">DALL·E 3</h4>
                <span className="text-xs px-3 py-1 bg-green-100 rounded-full text-green-800 font-semibold">Latest Model</span>
              </div>
              
              <div className="p-4">
                <div className="image-card relative overflow-hidden rounded-lg border border-gray-200 shadow-sm max-w-xs mx-auto aspect-[4/3]">
                  <img 
                    src={pair.dalle3ImageUrl}
                    alt={`DALL·E 3 generated image for: ${pair.prompt}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="px-4 pb-4 pt-2 flex justify-center">
                <Button 
                  variant={votedPairs[pair.id] === "dalle3" ? "default" : "outline"}
                  size="default"
                  className={votedPairs[pair.id] === "dalle3" 
                    ? "bg-primary text-white hover:bg-primary/90 w-full py-2 text-sm" 
                    : "border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white w-full py-2 text-sm"}
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
