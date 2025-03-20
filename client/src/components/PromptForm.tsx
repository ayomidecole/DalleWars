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
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
                <div className="flex items-center text-sm text-gray-700 font-medium bg-gray-100 px-3 py-1 rounded-full">
                  <span className="font-bold">{prompt.length}</span>&nbsp;characters
                </div>
                
                <Button 
                  type="submit" 
                  disabled={generateMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold text-base px-6 py-6 h-auto shadow-sm"
                  size="lg"
                >
                  <Paintbrush className="mr-2 h-5 w-5" />
                  {generateMutation.isPending ? "Generating..." : "Generate Images"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
