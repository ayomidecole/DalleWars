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
