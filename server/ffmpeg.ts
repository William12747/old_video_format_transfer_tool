import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { storage } from "./storage";

export async function processVideo(jobId: number, inputPath: string, outputDir: string) {
  try {
    const job = await storage.getJob(jobId);
    if (!job) return;

    await storage.updateJobStatus(jobId, "processing");

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilename = `converted_${path.basename(inputPath, path.extname(inputPath))}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);
    const publicUrl = `/converted/${outputFilename}`;

    console.log(`Starting conversion for Job ${jobId}: ${inputPath} -> ${outputPath}`);

    return new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .format("mp4")
        .on("progress", (progress) => {
          // Progress object: { frames: 123, currentFps: 23, currentKbps: 456, targetSize: 789, timemark: '00:01:23.45', percent: 12.34 }
          const percent = progress.percent ? Math.round(progress.percent) : 0;
          if (percent > 0 && percent <= 100) {
            storage.updateJobProgress(jobId, percent).catch(console.error);
          }
        })
        .on("end", async () => {
          console.log(`Job ${jobId} completed successfully.`);
          await storage.updateJobStatus(jobId, "completed", publicUrl);
          
          // Optional: Delete original file to save space? 
          // For now, keep it or maybe clean it up later.
          // fs.unlinkSync(inputPath); 
          
          resolve();
        })
        .on("error", async (err) => {
          console.error(`Job ${jobId} failed:`, err);
          await storage.updateJobStatus(jobId, "failed", undefined, err.message);
          reject(err);
        })
        .run();
    });

  } catch (err: any) {
    console.error(`Unexpected error in processVideo for Job ${jobId}:`, err);
    await storage.updateJobStatus(jobId, "failed", undefined, err.message || "Unknown error");
  }
}
