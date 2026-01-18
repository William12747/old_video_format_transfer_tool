import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  onSelect: () => void;
}

export function EmptyState({ onSelect }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border/50 rounded-2xl bg-card/20 hover:bg-card/30 transition-colors">
      <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
        <FolderOpen className="w-10 h-10" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2 text-foreground">No files selected</h3>
      <p className="text-muted-foreground max-w-sm mb-8">
        Select a folder to scan for old video formats (.flv, .rmvb, .wmv, etc.) and convert them to modern MP4.
      </p>
      
      <button
        onClick={onSelect}
        className="
          px-6 py-3 rounded-xl font-semibold text-primary-foreground
          bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25
          transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0
        "
      >
        Select Folder to Scan
      </button>
    </div>
  );
}
