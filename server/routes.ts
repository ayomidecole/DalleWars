import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertImagePairSchema, insertVoteSchema } from "@shared/schema";
import OpenAI from "openai";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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

  const httpServer = createServer(app);
  return httpServer;
}
