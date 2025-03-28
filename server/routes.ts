import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertImagePairSchema, insertVoteSchema } from "@shared/schema";
import OpenAI from "openai";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all image pairs
  app.get("/api/image-pairs", async (req: Request, res: Response) => {
    try {
      const imagePairs = await storage.getImagePairs();
      res.json(imagePairs);
    } catch (error) {
      console.error("Error getting image pairs:", error);
      res.status(500).json({ message: "Failed to get image pairs" });
    }
  });
  
  // Get the latest image pair
  app.get("/api/latest-image-pair", async (req: Request, res: Response) => {
    try {
      const latestImagePair = await storage.getLatestImagePair();
      if (!latestImagePair) {
        return res.status(404).json({ message: "No image pairs found" });
      }
      res.json(latestImagePair);
    } catch (error) {
      console.error("Error getting latest image pair:", error);
      res.status(500).json({ message: "Failed to get latest image pair" });
    }
  });

  // Get a specific image pair
  app.get("/api/image-pairs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const imagePair = await storage.getImagePair(id);
      if (!imagePair) {
        return res.status(404).json({ message: "Image pair not found" });
      }

      res.json(imagePair);
    } catch (error) {
      console.error("Error getting image pair:", error);
      res.status(500).json({ message: "Failed to get image pair" });
    }
  });

  // Generate new image pair
  app.post("/api/generate", async (req: Request, res: Response) => {
    try {
      // Validate request
      const promptSchema = z.object({
        prompt: z.string().min(3).max(1000)
      });
      
      const { prompt } = promptSchema.parse(req.body);

      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      
      // Generate DALL-E 2 image
      const dalle2Response = await openai.images.generate({
        model: "dall-e-2",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });
      const dalle2ImageUrl = dalle2Response.data[0]?.url;
      
      if (!dalle2ImageUrl) {
        throw new Error("Failed to generate DALL-E 2 image");
      }

      // Generate DALL-E 3 image
      const dalle3Response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      const dalle3ImageUrl = dalle3Response.data[0]?.url;
      
      if (!dalle3ImageUrl) {
        throw new Error("Failed to generate DALL-E 3 image");
      }

      // Create image pair in storage
      const newImagePair = await storage.createImagePair({
        prompt,
        dalle2ImageUrl,
        dalle3ImageUrl
      });

      res.status(201).json(newImagePair);
    } catch (error) {
      console.error("Error generating images:", error);
      
      if (error instanceof Error) {
        if (error instanceof z.ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: "Invalid prompt format", error: validationError.message });
        }
        
        if (error instanceof OpenAI.APIError) {
          return res.status(error.status || 500).json({
            message: "OpenAI API error",
            error: error.message
          });
        }
        
        return res.status(500).json({ message: "Failed to generate images", error: error.message });
      }
      
      res.status(500).json({ message: "Failed to generate images" });
    }
  });

  // Submit a vote
  app.post("/api/vote", async (req: Request, res: Response) => {
    try {
      // Validate request
      const parsedVote = insertVoteSchema.parse(req.body);
      
      // Check if image pair exists
      const imagePair = await storage.getImagePair(parsedVote.imagePairId);
      if (!imagePair) {
        return res.status(404).json({ message: "Image pair not found" });
      }
      
      // Check if already voted for this image pair
      const hasVoted = await storage.hasVotedForImagePair(parsedVote.imagePairId);
      if (hasVoted) {
        return res.status(400).json({ message: "You've already voted for this image pair" });
      }

      // Create vote
      const vote = await storage.createVote(parsedVote);
      
      // Get updated scores
      const scores = await storage.getScores();
      
      res.status(201).json({ vote, scores });
    } catch (error) {
      console.error("Error submitting vote:", error);
      
      if (error instanceof Error) {
        if (error instanceof z.ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: "Invalid vote data", error: validationError.message });
        }
        return res.status(500).json({ message: "Failed to submit vote", error: error.message });
      }
      
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  // Get current scores
  app.get("/api/scores", async (req: Request, res: Response) => {
    try {
      const scores = await storage.getScores();
      res.json(scores);
    } catch (error) {
      console.error("Error getting scores:", error);
      res.status(500).json({ message: "Failed to get scores" });
    }
  });

  // API status check
  app.get("/api/status", async (req: Request, res: Response) => {
    const hasApiKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "";
    
    res.json({
      status: hasApiKey ? "active" : "missing-api-key"
    });
  });
  
  // Generate dad jokes
  app.get("/api/dad-jokes", async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      
      const count = req.query.count ? parseInt(req.query.count as string) : 3;
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a dad joke generator. Generate short, family-friendly dad jokes. Each joke should be in title case."
          },
          {
            role: "user",
            content: `Generate ${count} dad jokes. Each joke should be on a new line. Keep them short and funny. The response should only contain the jokes, nothing else.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });
      
      const jokes = response.choices[0]?.message.content?.split('\n').filter(joke => joke.trim() !== '') || [];
      
      res.json({ jokes });
    } catch (error) {
      console.error("Error generating dad jokes:", error);
      
      if (error instanceof Error) {
        if (error instanceof OpenAI.APIError) {
          return res.status(error.status || 500).json({
            message: "OpenAI API error",
            error: error.message
          });
        }
        
        return res.status(500).json({ message: "Failed to generate jokes", error: error.message });
      }
      
      res.status(500).json({ message: "Failed to generate jokes" });
    }
  });
  
  // Speech to text conversion using Whisper API
  app.post("/api/speech-to-text", async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      
      if (!req.body.audio) {
        return res.status(400).json({ message: "No audio data provided" });
      }
      
      // The audio data should be a base64 encoded string in the format: data:audio/webm;base64,...
      const base64Audio = req.body.audio.split(',')[1];
      
      if (!base64Audio) {
        return res.status(400).json({ message: "Invalid audio data format" });
      }
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(base64Audio, 'base64');
      
      // Create a temporary file
      const tempFile = path.join(os.tmpdir(), `${Date.now()}.webm`);
      fs.writeFileSync(tempFile, audioBuffer);
      
      try {
        // Create a readable stream from the temp file
        const audioFile = fs.createReadStream(tempFile);
        
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1", // Use the smallest, cheapest model
          language: "en", // You can make this dynamic based on user preference
        });
        
        // Remove the temporary file
        fs.unlinkSync(tempFile);
        
        return res.json({ text: transcription.text });
      } catch (err) {
        // Make sure to clean up the temp file in case of error
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
        throw err;
      }
    } catch (error) {
      console.error("Error in speech to text:", error);
      
      if (error instanceof Error) {
        if (error instanceof OpenAI.APIError) {
          return res.status(error.status || 500).json({
            message: "OpenAI API error",
            error: error.message
          });
        }
        
        return res.status(500).json({ message: "Failed to convert speech to text", error: error.message });
      }
      
      res.status(500).json({ message: "Failed to convert speech to text" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
