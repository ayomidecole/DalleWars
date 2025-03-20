import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Image pairs for comparison
export const imagePairs = pgTable("image_pairs", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  dalle2ImageUrl: text("dalle2_image_url").notNull(),
  dalle3ImageUrl: text("dalle3_image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertImagePairSchema = createInsertSchema(imagePairs).pick({
  prompt: true,
  dalle2ImageUrl: true,
  dalle3ImageUrl: true,
});

export type InsertImagePair = z.infer<typeof insertImagePairSchema>;
export type ImagePair = typeof imagePairs.$inferSelect;

// Votes on image pairs
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  imagePairId: integer("image_pair_id").notNull(),
  votedForDalle3: boolean("voted_for_dalle3").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  imagePairId: true,
  votedForDalle3: true,
});

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

// Score schema for retrieving current standings
export const scoreSchema = z.object({
  dalle2: z.number(),
  dalle3: z.number(),
  totalVotes: z.number(),
});

export type Score = z.infer<typeof scoreSchema>;
