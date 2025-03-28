import { apiRequest } from "./queryClient";

// Function to generate images from DALL-E 2 and DALL-E 3
export async function generateImages(prompt: string) {
  try {
    const response = await apiRequest("POST", "/api/generate", { prompt });
    return await response.json();
  } catch (error) {
    console.error("Error generating images:", error);
    throw error;
  }
}

// Function to submit a vote
export async function submitVote(imagePairId: number, votedForDalle3: boolean) {
  try {
    const response = await apiRequest("POST", "/api/vote", { 
      imagePairId, 
      votedForDalle3 
    });
    return await response.json();
  } catch (error) {
    console.error("Error submitting vote:", error);
    throw error;
  }
}

// Function to check API status
export async function checkApiStatus() {
  try {
    const response = await apiRequest("GET", "/api/status");
    return await response.json();
  } catch (error) {
    console.error("Error checking API status:", error);
    throw error;
  }
}

// Function to fetch dad jokes
export async function getDadJokes(count: number = 3) {
  try {
    const response = await apiRequest("GET", `/api/dad-jokes?count=${count}`);
    const data = await response.json();
    return data.jokes || [];
  } catch (error) {
    console.error("Error fetching dad jokes:", error);
    // Return empty array on error instead of throwing
    return [];
  }
}

// Function to convert speech to text using Whisper API
export async function convertSpeechToText(audioBlob: Blob): Promise<string> {
  try {
    // Make sure we have a proper audio blob
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error("No audio data recorded");
    }

    // Create a proper audio blob with mp3 type for compatibility with OpenAI's Whisper API
    const audioFile = new Blob([audioBlob], { type: "audio/mp3" });
    
    // Convert audio blob to base64
    const reader = new FileReader();
    const audioBase64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read audio data"));
      reader.readAsDataURL(audioFile);
    });
    
    const audioBase64 = await audioBase64Promise;
    
    if (!audioBase64 || audioBase64.length < 100) {
      throw new Error("Invalid audio data");
    }
    
    console.log("Sending audio data to server...");
    
    const response = await apiRequest("POST", "/api/speech-to-text", { 
      audio: audioBase64 
    });
    
    const data = await response.json();
    
    if (response.status !== 200) {
      throw new Error(data.message || "Error from server");
    }
    
    return data.text || "";
  } catch (error) {
    console.error("Error converting speech to text:", error);
    throw error;
  }
}
