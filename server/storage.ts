import { 
  ImagePair, InsertImagePair, 
  Vote, InsertVote,
  Score,
  imagePairs,
  votes
} from "@shared/schema";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';
import { eq, desc, sql } from 'drizzle-orm';

// Load environment variables
dotenv.config();

export interface IStorage {
  // Image pairs
  getImagePairs(): Promise<ImagePair[]>;
  getImagePair(id: number): Promise<ImagePair | undefined>;
  createImagePair(imagePair: InsertImagePair): Promise<ImagePair>;
  
  // Votes
  getVotes(): Promise<Vote[]>;
  getVotesByImagePairId(imagePairId: number): Promise<Vote[]>;
  hasVotedForImagePair(imagePairId: number): Promise<boolean>;
  createVote(vote: InsertVote): Promise<Vote>;
  
  // Scores
  getScores(): Promise<Score>;
}

export class MemStorage implements IStorage {
  private imagePairs: Map<number, ImagePair>;
  private votes: Map<number, Vote>;
  private imagePairsCurrentId: number;
  private votesCurrentId: number;

  constructor() {
    this.imagePairs = new Map();
    this.votes = new Map();
    this.imagePairsCurrentId = 1;
    this.votesCurrentId = 1;
  }

  // Image pairs
  async getImagePairs(): Promise<ImagePair[]> {
    return Array.from(this.imagePairs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getImagePair(id: number): Promise<ImagePair | undefined> {
    return this.imagePairs.get(id);
  }

  async createImagePair(insertImagePair: InsertImagePair): Promise<ImagePair> {
    const id = this.imagePairsCurrentId++;
    const imagePair: ImagePair = { 
      ...insertImagePair, 
      id,
      createdAt: new Date()
    };
    this.imagePairs.set(id, imagePair);
    return imagePair;
  }

  // Votes
  async getVotes(): Promise<Vote[]> {
    return Array.from(this.votes.values());
  }

  async getVotesByImagePairId(imagePairId: number): Promise<Vote[]> {
    return Array.from(this.votes.values())
      .filter(vote => vote.imagePairId === imagePairId);
  }
  
  async hasVotedForImagePair(imagePairId: number): Promise<boolean> {
    const votes = await this.getVotesByImagePairId(imagePairId);
    return votes.length > 0;
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const id = this.votesCurrentId++;
    const vote: Vote = { 
      ...insertVote, 
      id,
      createdAt: new Date()
    };
    this.votes.set(id, vote);
    return vote;
  }

  // Scores
  async getScores(): Promise<Score> {
    const votes = Array.from(this.votes.values());
    const totalVotes = votes.length;
    const dalle3Votes = votes.filter(vote => vote.votedForDalle3).length;
    const dalle2Votes = totalVotes - dalle3Votes;
    
    return {
      dalle2: dalle2Votes,
      dalle3: dalle3Votes,
      totalVotes
    };
  }
}

export class PostgresStorage implements IStorage {
  private db: any;

  constructor() {
    // Initialize connection to PostgreSQL database
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
    
    console.log('PostgreSQL database connection initialized');
  }

  // Image pairs
  async getImagePairs(): Promise<ImagePair[]> {
    try {
      return await this.db.select().from(imagePairs).orderBy(desc(imagePairs.createdAt));
    } catch (error) {
      console.error('Error fetching image pairs:', error);
      return [];
    }
  }

  async getImagePair(id: number): Promise<ImagePair | undefined> {
    try {
      const results = await this.db.select().from(imagePairs).where(eq(imagePairs.id, id));
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Error fetching image pair with id ${id}:`, error);
      return undefined;
    }
  }

  async createImagePair(insertImagePair: InsertImagePair): Promise<ImagePair> {
    try {
      const results = await this.db.insert(imagePairs).values(insertImagePair).returning();
      return results[0];
    } catch (error) {
      console.error('Error creating image pair:', error);
      throw error;
    }
  }

  // Votes
  async getVotes(): Promise<Vote[]> {
    try {
      return await this.db.select().from(votes);
    } catch (error) {
      console.error('Error fetching votes:', error);
      return [];
    }
  }

  async getVotesByImagePairId(imagePairId: number): Promise<Vote[]> {
    try {
      return await this.db.select().from(votes).where(eq(votes.imagePairId, imagePairId));
    } catch (error) {
      console.error(`Error fetching votes for image pair ${imagePairId}:`, error);
      return [];
    }
  }
  
  async hasVotedForImagePair(imagePairId: number): Promise<boolean> {
    try {
      const voteCount = await this.db.select({ count: sql`count(*)` })
        .from(votes)
        .where(eq(votes.imagePairId, imagePairId));
      
      return parseInt(voteCount[0].count as string, 10) > 0;
    } catch (error) {
      console.error(`Error checking if voted for image pair ${imagePairId}:`, error);
      return false;
    }
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    try {
      const results = await this.db.insert(votes).values(insertVote).returning();
      return results[0];
    } catch (error) {
      console.error('Error creating vote:', error);
      throw error;
    }
  }

  // Scores
  async getScores(): Promise<Score> {
    try {
      const allVotes = await this.getVotes();
      const totalVotes = allVotes.length;
      const dalle3Votes = allVotes.filter(vote => vote.votedForDalle3).length;
      const dalle2Votes = totalVotes - dalle3Votes;
      
      return {
        dalle2: dalle2Votes,
        dalle3: dalle3Votes,
        totalVotes
      };
    } catch (error) {
      console.error('Error calculating scores:', error);
      return { dalle2: 0, dalle3: 0, totalVotes: 0 };
    }
  }
}

// Use PostgreSQL storage instead of in-memory storage
export const storage = new PostgresStorage();
