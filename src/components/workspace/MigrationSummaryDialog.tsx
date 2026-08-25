 import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TreeNode } from '@/types/migration';
import { SelectedPowerBIWorkspace } from '@/components/workspace/DestinationWorkspaceSelection';
 import { TableauIcon, PowerBIIcon } from '@/components/icons/SourceIcons';

interface MigrationSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceNode: TreeNode | undefined;
  sourceName: string;
  destinationWorkspace: SelectedPowerBIWorkspace | null;
  onConfirm: () => void;
   isLoading?: boolean;
}

const MigrationSummaryDialog = ({
  open,
  onOpenChange,
  sourceNode,
  sourceName,
  destinationWorkspace,
  onConfirm,
   isLoading = false,
}: MigrationSummaryDialogProps) => {
  if (!sourceNode || !destinationWorkspace) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Migration Summary</DialogTitle>
          <DialogDescription>
            Review the migration details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Source & Destination Visual */}
           <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted/30">
            {/* Source */}
            <div className="flex flex-col items-center text-center">
               <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-2">
                 <TableauIcon className="w-6 h-6" />
              </div>
              <p className="text-xs text-muted-foreground">Source</p>
               <p className="text-sm font-medium max-w-[120px] truncate" title={sourceNode.name}>{sourceNode.name}</p>
               <p className="text-xs text-muted-foreground">{sourceName}</p>
            </div>

            {/* Arrow */}
             <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />

            {/* Destination */}
            <div className="flex flex-col items-center text-center">
               <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
                 <PowerBIIcon className="w-6 h-6" />
              </div>
              <p className="text-xs text-muted-foreground">Destination</p>
               <p className="text-sm font-medium max-w-[120px] truncate" title={destinationWorkspace.name}>{destinationWorkspace.name}</p>
               <p className="text-xs text-muted-foreground">Power BI</p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Source Platform</span>
              <span className="font-medium">{sourceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item Type</span>
              <span className="font-medium capitalize">{sourceNode.type}</span>
            </div>
             {sourceNode.children && sourceNode.children.length > 0 && (
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Sheets/Views</span>
                 <span className="font-medium">{sourceNode.children.length}</span>
               </div>
             )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Destination</span>
               <span className="font-medium">{destinationWorkspace.name}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
             This will migrate your {sourceNode.type} to the selected Power BI workspace.
          </p>
        </div>

        <DialogFooter className="gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
           <Button variant="powerbi" onClick={onConfirm} disabled={isLoading}>
             {isLoading ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Starting Migration...
               </>
             ) : (
               "Start Migration"
             )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MigrationSummaryDialog;