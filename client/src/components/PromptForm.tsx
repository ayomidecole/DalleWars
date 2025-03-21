import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Paintbrush, Sparkles } from "lucide-react";
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
    <section className="mb-12 relative z-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 neon-text flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Imagine & Create
          <Sparkles className="w-4 h-4 text-primary/80 animate-pulse" />
        </h2>
        
        <Card className="neon-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5"></div>
          <CardContent className="pt-6 py-8 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="prompt" className="block font-medium mb-3 text-lg">
                  Your creative prompt
                </label>
                <div className="relative">
                  <Textarea 
                    id="prompt" 
                    rows={4} 
                    placeholder="A futuristic city with flying cars and neon lights..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="neon-input resize-none text-base px-4 py-3 bg-background/60"
                  />
                  <div className="absolute inset-0 pointer-events-none border border-primary/10 rounded-md opacity-50"></div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={generateMutation.isPending}
                  className="neon-button group relative overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <Paintbrush className="mr-1.5 h-4 w-4 group-hover:animate-pulse" />
                  <span className="relative z-10">
                    {generateMutation.isPending ? "Generating..." : "Generate Images"}
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
