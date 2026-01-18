import { motion } from "framer-motion";
import { FileVideo, CheckCircle2, AlertCircle, Loader2, Play, Trash2, Clock } from "lucide-react";
import { type ConversionJob } from "@shared/schema";
import { formatBytes } from "@/lib/utils";

interface JobItemProps {
  job: ConversionJob;
  onPreview: (job: ConversionJob) => void;
  onDelete: (id: number) => void;
}

export function JobItem({ job, onPreview, onDelete }: JobItemProps) {
  const isProcessing = job.status === "processing";
  const isCompleted = job.status === "completed";
  const isFailed = job.status === "failed";
  const isPending = job.status === "pending";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-card/40 hover:bg-card/60 border border-border/50 hover:border-border rounded-xl p-4 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        {/* Icon Status */}
        <div className={`
          flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
          ${isCompleted ? 'bg-green-500/10 text-green-500' : ''}
          ${isFailed ? 'bg-red-500/10 text-red-500' : ''}
          ${isProcessing ? 'bg-primary/10 text-primary' : ''}
          ${isPending ? 'bg-muted text-muted-foreground' : ''}
        `}>
          {isCompleted && <CheckCircle2 className="w-6 h-6" />}
          {isFailed && <AlertCircle className="w-6 h-6" />}
          {isProcessing && <Loader2 className="w-6 h-6 animate-spin" />}
          {isPending && <Clock className="w-6 h-6" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* File Info */}
          <div className="md:col-span-5">
            <h4 className="font-medium text-foreground truncate" title={job.originalName}>
              {job.originalName}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">
                {job.originalName.split('.').pop()?.toUpperCase()}
              </span>
              <span>•</span>
              <span>{formatBytes(job.size || 0)}</span>
              {job.error && (
                <>
                  <span>•</span>
                  <span className="text-red-400 truncate max-w-[200px]">{job.error}</span>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="md:col-span-4 flex flex-col justify-center">
            {isProcessing && (
              <div className="w-full">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-primary font-medium">Converting...</span>
                  <span className="text-muted-foreground">{job.progress}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${job.progress || 0}%` }}
                    transition={{ type: "spring", stiffness: 50 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            )}
            
            {isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                Waiting in queue...
              </div>
            )}

            {isCompleted && (
              <div className="text-sm text-green-500 font-medium flex items-center gap-1.5">
                Conversion successful
              </div>
            )}
            
            {isFailed && (
              <div className="text-sm text-red-500 font-medium">
                Conversion failed
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            {isCompleted && (
              <button
                onClick={() => onPreview(job)}
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-white/5 hover:bg-white/10 text-foreground
                  border border-white/10 hover:border-white/20
                  transition-all active:scale-95
                "
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Preview
              </button>
            )}
            
            <button
              onClick={() => onDelete(job.id)}
              className="
                p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10
                transition-colors active:scale-95
              "
              title="Remove from list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
