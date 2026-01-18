import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { conversionJobs } from "@shared/schema";
import type { z } from "zod";

// Valid file extensions to scan for
export const VALID_EXTENSIONS = ['.flv', '.asf', '.rmvb', '.mpeg', '.mpg', '.wmv', '.avi', '.mp4'];

type Job = typeof conversionJobs.$inferSelect;

export function useJobs() {
  return useQuery({
    queryKey: [api.jobs.list.path],
    queryFn: async () => {
      const res = await fetch(api.jobs.list.path);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return api.jobs.list.responses[200].parse(await res.json());
    },
    // Poll every 2 seconds for active jobs
    refetchInterval: (query) => {
      const hasActiveJobs = query.state.data?.some(
        (job) => job.status === "pending" || job.status === "processing"
      );
      return hasActiveJobs ? 2000 : false;
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.jobs.create.path, {
        method: api.jobs.create.method,
        body: formData,
        // Don't set Content-Type header manually for FormData, browser does it with boundary
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.jobs.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create conversion job");
      }
      return api.jobs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.jobs.delete.path, { id });
      const res = await fetch(url, { method: api.jobs.delete.method });
      if (!res.ok) throw new Error("Failed to delete job");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}

export function useDeleteAllJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.jobs.deleteAll.path, { 
        method: api.jobs.deleteAll.method 
      });
      if (!res.ok) throw new Error("Failed to clear jobs");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}

// Helper to filter valid files from a FileList
export function scanFiles(fileList: FileList): File[] {
  console.log("Scanning files:", fileList.length);
  const validFiles = Array.from(fileList).filter(file => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValid = VALID_EXTENSIONS.includes(ext);
    console.log(`File: ${file.name}, Ext: ${ext}, Valid: ${isValid}`);
    return isValid;
  });
  console.log("Valid files found:", validFiles.length);
  return validFiles;
}
