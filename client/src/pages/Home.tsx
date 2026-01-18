import { useState, useRef } from "react";
import { useJobs, useCreateJob, useDeleteJob, useDeleteAllJobs, scanFiles, VALID_EXTENSIONS } from "@/hooks/use-jobs";
import { JobItem } from "@/components/JobItem";
import { PreviewModal } from "@/components/PreviewModal";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, Trash2, PlayCircle, FolderSearch, StopCircle, Download } from "lucide-react";
import { type ConversionJob } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewJob, setPreviewJob] = useState<ConversionJob | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const { data: jobs = [], isLoading } = useJobs();
  const createJob = useCreateJob();
  const deleteJob = useDeleteJob();
  const deleteAll = useDeleteAllJobs();

  // Calculate stats
  const pendingCount = jobs.filter(j => j.status === 'pending').length;
  const processingCount = jobs.filter(j => j.status === 'processing').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;
  
  const isProcessing = processingCount > 0;

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsScanning(true);
    const files = e.target.files;
    const validFiles = scanFiles(files);
    
    if (validFiles.length === 0) {
      toast({
        title: "No compatible files found",
        description: `We looked for ${VALID_EXTENSIONS.join(', ')} but found none.`,
        variant: "destructive",
      });
      setIsScanning(false);
      // Reset input so same folder can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    toast({
      title: "Scanning complete",
      description: `Found ${validFiles.length} files to convert. Adding to queue...`,
    });

    // Upload files sequentially to create jobs
    // In a real desktop app we might batch this differently, but for web 
    // we want to ensure we don't freeze the browser with 1000 requests at once.
    // For this MVP, we'll fire them all and let the browser/network queue handle it,
    // as creating the job entry is fast (file upload overhead depends on size).
    // Optimally: Implement a concurrency limit queue here.
    
    let added = 0;
    try {
      // Just take first 50 for MVP safety if user selects massive folder
      // Or implement proper queue. Here we'll do simple iteration.
      for (const file of validFiles) {
        await createJob.mutateAsync(file);
        added++;
      }
      
      toast({
        title: "Queue Updated",
        description: `Successfully added ${added} files to the conversion queue.`,
        variant: "default", 
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error adding files",
        description: "Some files could not be added to the queue.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFolderSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col font-sans">
      {/* Hidden Input for Folder Selection */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        // @ts-expect-error - webkitdirectory is standard in modern browsers but missing in types
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold">
              VC
            </div>
            <h1 className="text-lg font-bold tracking-tight">VideoConverter <span className="text-primary">Pro</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground mr-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span>Processing: <span className="text-foreground font-medium">{processingCount}</span></span>
              </div>
              <div>Pending: <span className="text-foreground font-medium">{pendingCount}</span></div>
              <div>Done: <span className="text-foreground font-medium">{completedCount}</span></div>
            </div>

            <button 
              onClick={triggerFolderSelect}
              disabled={isScanning}
              className="
                px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 
                text-sm font-medium transition-colors flex items-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <FolderSearch className="w-4 h-4" />
                  Add Folder
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        
        {/* Actions Bar */}
        {jobs.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Conversion Queue 
              <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {jobs.length} files
              </span>
            </h2>
            
            <div className="flex gap-2">
              {completedCount > 0 && (
                <button
                  onClick={() => window.location.href = api.jobs.downloadAll.path}
                  className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download All ({completedCount})
                </button>
              )}
              <button
                onClick={() => deleteAll.mutate()}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* List Content */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
            <p>Loading queue...</p>
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState onSelect={triggerFolderSelect} />
        ) : (
          <div className="grid gap-3">
            <AnimatePresence initial={false}>
              {jobs.map((job) => (
                <JobItem 
                  key={job.id} 
                  job={job} 
                  onPreview={setPreviewJob}
                  onDelete={(id) => deleteJob.mutate(id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer Status */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm py-3 px-6 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span>Supported formats: {VALID_EXTENSIONS.join(', ')}</span>
          <span className={isProcessing ? "text-primary font-medium animate-pulse" : ""}>
            {isProcessing ? "Processing active..." : "Ready"}
          </span>
        </div>
      </footer>

      {/* Preview Modal */}
      <PreviewModal 
        job={previewJob} 
        open={!!previewJob} 
        onOpenChange={(open) => !open && setPreviewJob(null)} 
      />
    </div>
  );
}
