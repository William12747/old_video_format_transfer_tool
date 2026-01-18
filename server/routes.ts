import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { storage } from "./storage";
import { processVideo } from "./ffmpeg";
import { api } from "@shared/routes";
import { z } from "zod";

// Configure storage for Multer
const uploadDir = path.join(process.cwd(), "uploads");
const convertedDir = path.join(process.cwd(), "public", "converted"); // Serve directly from public for preview

// Ensure directories exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(convertedDir)) {
  fs.mkdirSync(convertedDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Keep original name but prepend timestamp to avoid collisions
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  }
});

import archiver from "archiver";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Serve converted files statically
  // Note: Vite dev server might need proxy config if we weren't using the standard Replit setup.
  // But here we are mounting it on express app which sits behind/alongside Vite.
  // We need to ensure /converted points to the physical directory.
  // However, in the template, public/ folder is served by Vite in dev.
  // We are writing to public/converted.
  // In production (npm start), express usually serves client/dist.
  // Let's explicitly serve the public/converted directory to be safe.
  app.use('/converted', express.static(convertedDir));

  // --- API Routes ---

  app.get(api.jobs.list.path, async (req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const job = await storage.getJob(Number(req.params.id));
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  app.post(api.jobs.create.path, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const job = await storage.createJob({
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        status: "pending",
        progress: 0
      });

      // Trigger background processing
      // We don't await this because we want to return the job ID immediately
      processVideo(job.id, req.file.path, convertedDir).catch(err => {
        console.error("Background processing error:", err);
      });

      res.status(201).json(job);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.jobs.delete.path, async (req, res) => {
    await storage.deleteJob(Number(req.params.id));
    res.status(204).send();
  });

  app.delete(api.jobs.deleteAll.path, async (req, res) => {
    await storage.deleteAllJobs();
    res.status(204).send();
  });

  app.get(api.jobs.downloadAll.path, async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      const completedJobs = jobs.filter(j => j.status === 'completed' && j.outputUrl);

      if (completedJobs.length === 0) {
        return res.status(400).json({ message: "No completed jobs to download" });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=converted_videos.zip');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      for (const job of completedJobs) {
        if (job.outputUrl) {
          const filename = path.basename(job.outputUrl);
          const filePath = path.join(convertedDir, filename);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: job.originalName.replace(/\.[^/.]+$/, "") + ".mp4" });
          }
        }
      }

      await archive.finalize();
    } catch (err) {
      console.error("Zip download error:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate zip file" });
      }
    }
  });

  return httpServer;
}
