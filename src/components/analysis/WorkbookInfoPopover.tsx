import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WorkbookMetadata } from "@/types/analysis";

const NA = () => <span className="text-muted-foreground italic">Not available</span>;

const formatDate = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

interface WorkbookInfoPopoverProps {
  meta: WorkbookMetadata;
}

/** Ownership/provenance details (project, owner, created/modified) used to
 * live in an always-open accordion section that pushed the more useful
 * usage/complexity signals further down the page. Moving it behind a
 * person icon keeps it one click away without competing for attention. */
const WorkbookInfoPopover = ({ meta }: WorkbookInfoPopoverProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="rounded-full" aria-label="Workbook details">
        <User className="w-4 h-4 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-80">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Workbook Details</p>
      <div className="space-y-2.5 text-sm">
        <div className="flex items-start justify-between gap-3">
          <span className="text-muted-foreground shrink-0">Project</span>
          <span className="text-right font-medium truncate">{meta.project || <NA />}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-muted-foreground shrink-0">Owner</span>
          <span className="text-right font-medium truncate" title={meta.owner}>{meta.owner || <NA />}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-muted-foreground shrink-0">Created</span>
          <span className="text-right font-medium">{formatDate(meta.created_at) || <NA />}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-muted-foreground shrink-0">Last modified</span>
          <span className="text-right font-medium">{formatDate(meta.updated_at) || <NA />}</span>
        </div>
        {meta.description && (
          <div className="pt-2 border-t border-border">
            <p className="text-muted-foreground mb-1">Description</p>
            <p className="text-xs leading-relaxed">{meta.description}</p>
          </div>
        )}
      </div>
    </PopoverContent>
  </Popover>
);

export default WorkbookInfoPopover;
