import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { checkApiStatus } from "@/lib/openai";

export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<"active" | "missing-api-key" | "loading" | "error">("loading");
  
  useEffect(() => {
    if (open) {
      checkApiStatus()
        .then(data => {
          setApiStatus(data.status);
        })
        .catch(() => {
          setApiStatus("error");
        });
    }
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-accent hover:text-primary transition">
          <Settings className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">API Settings</DialogTitle>
          <DialogDescription>
            Configuration for OpenAI API integration
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="apiKey" className="block text-accent font-medium mb-2">OpenAI API Key</label>
            <input
              type="password"
              id="apiKey"
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Your API key is stored securely on the server"
              disabled
            />
            <p className="mt-2 text-sm text-accent">
              Your API key is never stored in the browser. It is securely managed on the server side.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="font-medium mb-2">API Status</h3>
            {apiStatus === "loading" && (
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                <span className="text-sm">Checking status...</span>
              </div>
            )}
            
            {apiStatus === "active" && (
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm">Connected</span>
              </div>
            )}
            
            {apiStatus === "missing-api-key" && (
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <span className="text-sm">API Key Missing</span>
              </div>
            )}
            
            {apiStatus === "error" && (
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <span className="text-sm">Connection Error</span>
              </div>
            )}
            
            <p className="mt-2 text-sm text-accent">
              {apiStatus === "active" && "Your application is properly configured to generate images using the OpenAI API."}
              {apiStatus === "missing-api-key" && "The OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable."}
              {apiStatus === "error" && "Could not connect to the API. Please check your server configuration."}
              {apiStatus === "loading" && "Verifying connection to the OpenAI API..."}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
