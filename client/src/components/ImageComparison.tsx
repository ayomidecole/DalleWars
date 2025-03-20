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
    return null;
  }
  
  return (
    <section id="imagesComparison" className="my-8">
      {imagePairs?.map((pair) => (
        <div key={pair.id} className="mb-10">
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
      ))}
    </section>
  );
}
