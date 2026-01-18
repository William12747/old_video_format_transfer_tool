import { conversionJobs, type ConversionJob, type InsertConversionJob } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createJob(job: InsertConversionJob): Promise<ConversionJob>;
  getJob(id: number): Promise<ConversionJob | undefined>;
  getJobs(): Promise<ConversionJob[]>;
  updateJobStatus(id: number, status: string, outputUrl?: string, error?: string): Promise<ConversionJob>;
  updateJobProgress(id: number, progress: number): Promise<ConversionJob>;
  deleteJob(id: number): Promise<void>;
  deleteAllJobs(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createJob(insertJob: InsertConversionJob): Promise<ConversionJob> {
    const [job] = await db
      .insert(conversionJobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async getJob(id: number): Promise<ConversionJob | undefined> {
    const [job] = await db
      .select()
      .from(conversionJobs)
      .where(eq(conversionJobs.id, id));
    return job;
  }

  async getJobs(): Promise<ConversionJob[]> {
    return await db
      .select()
      .from(conversionJobs)
      .orderBy(desc(conversionJobs.createdAt));
  }

  async updateJobStatus(id: number, status: string, outputUrl?: string, error?: string): Promise<ConversionJob> {
    const [job] = await db
      .update(conversionJobs)
      .set({ 
        status, 
        outputUrl, 
        error,
        progress: status === 'completed' ? 100 : undefined
      })
      .where(eq(conversionJobs.id, id))
      .returning();
    return job;
  }

  async updateJobProgress(id: number, progress: number): Promise<ConversionJob> {
    const [job] = await db
      .update(conversionJobs)
      .set({ progress })
      .where(eq(conversionJobs.id, id))
      .returning();
    return job;
  }

  async deleteJob(id: number): Promise<void> {
    await db.delete(conversionJobs).where(eq(conversionJobs.id, id));
  }

  async deleteAllJobs(): Promise<void> {
    await db.delete(conversionJobs);
  }
}

export const storage = new DatabaseStorage();
