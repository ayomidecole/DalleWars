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
      
      // Add timestamp and random seed to ensure different jokes each time
      const timestamp = new Date().toISOString();
      const randomSeed = Math.floor(Math.random() * 10000);
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a dad joke generator that creates diverse, unique jokes. Never repeat jokes, especially avoid the common 'scarecrow' joke. Create original, family-friendly puns and wordplay."
          },
          {
            role: "user",
            content: `Generate ${count} original dad jokes. Each joke should be on a new line. Include variety - jokes about animals, food, everyday objects. No jokes about scarecrows. Current timestamp: ${timestamp}. Random seed: ${randomSeed}. The response should only contain the jokes, nothing else.`
          }
        ],
        temperature: 1.0, // Increase temperature for more randomness
        max_tokens: 150,
        presence_penalty: 0.6, // Discourage repetition of similar phrases
        frequency_penalty: 0.8 // Strongly discourage repeating the same jokes
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
    let tempFile = '';
    
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      
      if (!req.body.audio) {
        return res.status(400).json({ message: "No audio data provided" });
      }
      
      // Parse the data URI
      const dataUriRegex = /^data:([^;]+);base64,(.+)$/;
      const matches = req.body.audio.match(dataUriRegex);
      
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ message: "Invalid audio data format" });
      }
      
      const mimeType = matches[1];
      const base64Audio = matches[2];
      
      if (!base64Audio) {
        return res.status(400).json({ message: "Invalid audio data content" });
      }
      
      console.log(`Processing audio with MIME type: ${mimeType}`);
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(base64Audio, 'base64');
      
      if (audioBuffer.length === 0) {
        return res.status(400).json({ message: "Empty audio buffer" });
      }
      
      console.log(`Audio buffer size: ${audioBuffer.length} bytes`);
      
      // Determine file extension based on MIME type
      let fileExtension = 'mp3'; // Default
      
      if (mimeType.includes('webm')) {
        fileExtension = 'webm';
      } else if (mimeType.includes('mp4')) {
        fileExtension = 'mp4';
      } else if (mimeType.includes('ogg')) {
        fileExtension = 'ogg';
      } else if (mimeType.includes('wav')) {
        fileExtension = 'wav';
      }
      
      // Create a temporary file with the appropriate extension
      tempFile = path.join(os.tmpdir(), `speech_${Date.now()}.${fileExtension}`);
      fs.writeFileSync(tempFile, audioBuffer);
      
      console.log(`Created temporary file: ${tempFile}`);
      
      // Create a readable stream from the temp file
      const audioFile = fs.createReadStream(tempFile);
      
      // Process with Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
        response_format: "json",
      });
      
      // Clean up the temp file
      fs.unlinkSync(tempFile);
      tempFile = '';
      
      console.log(`Transcription successful: "${transcription.text}"`);
      
      return res.json({ text: transcription.text });
    } catch (error) {
      // Clean up temp file if it exists
      if (tempFile && fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          console.error("Error cleaning up temp file:", e);
        }
      }
      
      console.error("Error in speech to text:", error);
      
      if (error instanceof Error) {
        if (error instanceof OpenAI.APIError) {
          return res.status(error.status || 500).json({
            message: "OpenAI API error",
            error: error.message
          });
        }
        
        return res.status(500).json({ 
          message: "Failed to convert speech to text", 
          error: error.message 
        });
      }
      
      res.status(500).json({ message: "Failed to convert speech to text" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
