import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversionJobs = pgTable("conversion_jobs", {
  id: serial("id").primaryKey(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"), // Size in bytes
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").default(0),
  outputUrl: text("output_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobSchema = createInsertSchema(conversionJobs).omit({ 
  id: true, 
  createdAt: true, 
  status: true, 
  progress: true, 
  outputUrl: true, 
  error: true 
});

export type ConversionJob = typeof conversionJobs.$inferSelect;
export type InsertConversionJob = z.infer<typeof insertJobSchema>;

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export const jobStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);
