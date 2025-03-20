import { 
  ImagePair, InsertImagePair, 
  Vote, InsertVote,
  Score
} from "@shared/schema";

export interface IStorage {
  // Image pairs
  getImagePairs(): Promise<ImagePair[]>;
  getImagePair(id: number): Promise<ImagePair | undefined>;
  createImagePair(imagePair: InsertImagePair): Promise<ImagePair>;
  
  // Votes
  getVotes(): Promise<Vote[]>;
  getVotesByImagePairId(imagePairId: number): Promise<Vote[]>;
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

export const storage = new MemStorage();
