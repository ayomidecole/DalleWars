import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Paintbrush, Mic } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { generateImages, convertSpeechToText } from "@/lib/openai";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImagePair } from "@shared/schema";

interface PromptFormProps {
  onGenerateStart: () => void;
  onGenerateComplete: (imagePair?: ImagePair) => void;
}

export default function PromptForm({ onGenerateStart, onGenerateComplete }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
  
  const speechToTextMutation = useMutation({
    mutationFn: convertSpeechToText,
    onSuccess: (text) => {
      if (text) {
        setPrompt(text);
        toast({
          title: "Speech transcribed",
          description: "Your speech has been converted to text.",
        });
      } else {
        toast({
          title: "Empty transcription",
          description: "Could not detect any speech. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Transcription failed",
        description: error instanceof Error ? error.message : "Failed to convert speech to text. Please try again.",
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
  
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert speech to text
        speechToTextMutation.mutate(audioBlob);
        
        // Stop all tracks in the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone...",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Microphone error",
        description: error instanceof Error 
          ? error.message 
          : "Could not access microphone. Please check your browser permissions.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Processing your speech...",
      });
    }
  };
  
  return (
    <section className="mb-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200 dark:heading-glow transition-colors">Generate Comparison Images</h2>
        
        <Card className="shadow-md bg-white border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:card-glow transition-all duration-200">
          <CardContent className="pt-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <label htmlFor="prompt" className="block text-gray-800 dark:text-gray-200 font-semibold mb-3 text-lg transition-colors">
                  Your prompt
                </label>
                <Textarea 
                  id="prompt" 
                  rows={4} 
                  placeholder="A futuristic city with flying cars and neon lights"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-none text-base px-4 py-3 bg-white text-gray-800 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:border-primary focus:ring-2 focus:ring-primary transition-colors pr-10"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={`absolute bottom-2 right-2 h-8 w-8 rounded-full text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors ${isRecording ? 'animate-pulse text-red-500 dark:text-red-500' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={speechToTextMutation.isPending}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  <Mic className={`h-5 w-5 ${isRecording ? 'text-red-500 dark:text-red-500' : ''}`} />
                </Button>
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
                  <span className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary via-blue-400 to-purple-500 opacity-0 group-hover:opacity-80 blur-lg group-hover:blur-md transition-all duration-300 group-hover:duration-200 dark:group-hover:opacity-90"></span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
