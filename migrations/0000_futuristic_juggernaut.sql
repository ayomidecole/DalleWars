CREATE TABLE "image_pairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"dalle2_image_url" text NOT NULL,
	"dalle3_image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_pair_id" integer NOT NULL,
	"voted_for_dalle3" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
