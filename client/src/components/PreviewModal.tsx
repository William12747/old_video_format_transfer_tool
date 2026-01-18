import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type ConversionJob } from "@shared/schema";
import { formatBytes } from "@/lib/utils";
import { Download } from "lucide-react";

interface PreviewModalProps {
  job: ConversionJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewModal({ job, open, onOpenChange }: PreviewModalProps) {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border-border p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b border-border/50 flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-lg font-medium">{job.originalName}</DialogTitle>
            <p className="text-xs text-muted-foreground font-mono">
              Converted to MP4 • {formatBytes(job.size || 0)}
            </p>
          </div>
          
          {job.outputUrl && (
             <a 
               href={job.outputUrl} 
               download 
               className="mr-8 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
             >
               <Download className="w-4 h-4" />
               Download
             </a>
          )}
        </DialogHeader>

        <div className="aspect-video bg-black flex items-center justify-center">
          {job.outputUrl ? (
            <video 
              controls 
              autoPlay 
              className="w-full h-full object-contain focus:outline-none"
              src={job.outputUrl}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="text-destructive">Preview unavailable</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
