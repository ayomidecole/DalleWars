import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Paintbrush } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { generateImages } from "@/lib/openai";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PromptFormProps {
  onGenerateStart: () => void;
  onGenerateComplete: () => void;
}

export default function PromptForm({ onGenerateStart, onGenerateComplete }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();
  
  const generateMutation = useMutation({
    mutationFn: generateImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/image-pairs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scores'] });
      setPrompt("");
      onGenerateComplete();
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
        <h2 className="text-xl font-medium mb-6">Generate Comparison Images</h2>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-accent font-medium mb-2">
                  Your prompt
                </label>
                <Textarea 
                  id="prompt" 
                  rows={3} 
                  placeholder="A futuristic city with flying cars and neon lights"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-none"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center text-sm text-accent">
                  <span>{prompt.length}</span> characters
                </div>
                
                <Button 
                  type="submit" 
                  disabled={generateMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Paintbrush className="mr-2 h-5 w-5" />
                  Generate Images
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
