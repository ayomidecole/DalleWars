import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Paintbrush } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { generateImages } from "@/lib/openai";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImagePair } from "@shared/schema";

interface PromptFormProps {
  onGenerateStart: () => void;
  onGenerateComplete: (imagePair?: ImagePair) => void;
}

export default function PromptForm({ onGenerateStart, onGenerateComplete }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();
  
  const generateMutation = useMutation({
    mutationFn: generateImages,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/image-pairs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/latest-image-pair'] });
      setPrompt("");
      onGenerateComplete(data as ImagePair);
      toast({
        title: "Images generated",
        description: "Your images have been successfully generated.",
      });
    },
    onError: (error) => {
      onGenerateComplete();
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate images. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to generate images.",
        variant: "destructive",
      });
      return;
    }
    
    onGenerateStart();
    generateMutation.mutate(prompt);
  };
  
  return (
    <section className="mb-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Generate Comparison Images</h2>
        
        <Card className="shadow-md border-gray-200">
          <CardContent className="pt-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="prompt" className="block text-gray-800 font-semibold mb-3 text-lg">
                  Your prompt
                </label>
                <Textarea 
                  id="prompt" 
                  rows={4} 
                  placeholder="A futuristic city with flying cars and neon lights"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-none text-base px-4 py-3 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={generateMutation.isPending}
                  className="relative overflow-hidden bg-primary text-white font-semibold text-sm px-5 py-2.5 h-auto shadow-md transition-all duration-300 group"
                  size="default"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400 via-primary to-purple-500 opacity-0 group-hover:opacity-40 blur transition-opacity duration-300"></span>
                  <span className="absolute inset-0 w-full h-full bg-primary opacity-0 group-hover:opacity-0 transition-opacity duration-300"></span>
                  <span className="relative flex items-center justify-center z-10">
                    <Paintbrush className="mr-1.5 h-4 w-4 group-hover:animate-pulse" />
                    {generateMutation.isPending ? "Generating..." : "Generate Images"}
                  </span>
                  <span className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary via-blue-400 to-purple-500 opacity-0 group-hover:opacity-70 blur-lg group-hover:blur-md transition-all duration-300 group-hover:duration-200"></span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
