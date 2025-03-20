import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { submitVote } from "@/lib/openai";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImagePair } from "@shared/schema";
import { Check } from "lucide-react";
import EmptyState from "./EmptyState";

interface ImageComparisonProps {
  loading: boolean;
}

export default function ImageComparison({ loading }: ImageComparisonProps) {
  const { toast } = useToast();
  const [votedPairs, setVotedPairs] = useState<Record<number, "dalle2" | "dalle3">>({});
  
  const { data: imagePairs, isLoading } = useQuery<ImagePair[]>({
    queryKey: ['/api/image-pairs'],
  });
  
  const voteMutation = useMutation({
    mutationFn: ({ imagePairId, votedForDalle3 }: { imagePairId: number; votedForDalle3: boolean }) => 
      submitVote(imagePairId, votedForDalle3),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/scores'] });
      setVotedPairs(prev => ({
        ...prev,
        [variables.imagePairId]: variables.votedForDalle3 ? "dalle3" : "dalle2"
      }));
      toast({
        title: "Vote recorded",
        description: "Thank you for your vote!",
      });
    },
    onError: (error) => {
      toast({
        title: "Vote failed",
        description: error instanceof Error ? error.message : "Failed to submit your vote.",
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
  
  if (!loading && (!imagePairs || imagePairs.length === 0)) {
    return <EmptyState />;
  }
  
  return (
    <section id="imagesComparison">
      {imagePairs?.map((pair) => (
        <div key={pair.id} className="mb-12">
          <div className="max-w-5xl mx-auto">
            <div className="p-4 mb-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium">
                Prompt: <span className="text-accent font-normal">{pair.prompt}</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* DALL-E 2 Image Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="font-medium text-secondary">DALL·E 2</h4>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-accent">Legacy Model</span>
                </div>
                
                <div className="p-4">
                  <div className="image-card relative overflow-hidden rounded-lg aspect-square">
                    <img 
                      src={pair.dalle2ImageUrl}
                      alt={`DALL·E 2 generated image for: ${pair.prompt}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="p-4 flex justify-center">
                  <Button 
                    variant={votedPairs[pair.id] === "dalle2" ? "default" : "outline"}
                    className={votedPairs[pair.id] === "dalle2" 
                      ? "bg-secondary hover:bg-secondary/90" 
                      : "border-2 border-secondary text-secondary hover:bg-secondary hover:text-white"}
                    onClick={() => handleVote(pair.id, false)}
                    disabled={!!votedPairs[pair.id]}
                  >
                    {votedPairs[pair.id] === "dalle2" ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Vote Recorded
                      </>
                    ) : (
                      "Vote for DALL·E 2"
                    )}
                  </Button>
                </div>
              </div>
              
              {/* DALL-E 3 Image Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="font-medium text-primary">DALL·E 3</h4>
                  <span className="text-xs px-2 py-1 bg-green-50 text-primary rounded-full">Latest Model</span>
                </div>
                
                <div className="p-4">
                  <div className="image-card relative overflow-hidden rounded-lg aspect-square">
                    <img 
                      src={pair.dalle3ImageUrl}
                      alt={`DALL·E 3 generated image for: ${pair.prompt}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="p-4 flex justify-center">
                  <Button 
                    variant={votedPairs[pair.id] === "dalle3" ? "default" : "outline"}
                    className={votedPairs[pair.id] === "dalle3" 
                      ? "bg-primary hover:bg-primary/90" 
                      : "border-2 border-primary text-primary hover:bg-primary hover:text-white"}
                    onClick={() => handleVote(pair.id, true)}
                    disabled={!!votedPairs[pair.id]}
                  >
                    {votedPairs[pair.id] === "dalle3" ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
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
      ))}
    </section>
  );
}
