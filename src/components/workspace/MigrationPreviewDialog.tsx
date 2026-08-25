 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { BookOpen, LayoutDashboard, FileText, Loader2, ArrowRight } from "lucide-react";
 import { TableauIcon, PowerBIIcon } from "@/components/icons/SourceIcons";
 
 interface MigrationPreviewDialogProps {
   isOpen: boolean;
   onConfirm: () => void;
   onCancel: () => void;
   isLoading?: boolean;
   workbookName: string;
   projectName?: string;
   viewCount: number;
   sourceName?: string;
 }
 
 const MigrationPreviewDialog = ({
   isOpen,
   onConfirm,
   onCancel,
   isLoading = false,
   workbookName,
   projectName,
   viewCount,
   sourceName = "Tableau",
 }: MigrationPreviewDialogProps) => {
   return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Migration Summary</DialogTitle>
           <DialogDescription>
             Review the content that will be migrated to Power BI
           </DialogDescription>
         </DialogHeader>
 
         <div className="py-4 space-y-4">
           {/* Source to Destination Flow */}
           <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted/30">
             {/* Source */}
             <div className="flex flex-col items-center text-center">
               <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-2">
                 <TableauIcon className="w-6 h-6" />
               </div>
               <p className="text-xs text-muted-foreground">Source</p>
               <p className="text-sm font-medium max-w-[100px] truncate" title={workbookName}>{workbookName}</p>
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
               <p className="text-sm font-medium text-muted-foreground italic">Select next →</p>
               <p className="text-xs text-muted-foreground">Power BI</p>
             </div>
           </div>
 
           {/* Migration Counts */}
           <div className="grid grid-cols-3 gap-3">
             <div className="p-3 rounded-lg border border-border text-center">
               <BookOpen className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
               <p className="text-xl font-semibold text-foreground">1</p>
               <p className="text-xs text-muted-foreground">Workbook</p>
             </div>
             <div className="p-3 rounded-lg border border-border text-center">
               <LayoutDashboard className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
               <p className="text-xl font-semibold text-foreground">{viewCount}</p>
               <p className="text-xs text-muted-foreground">Sheets/Views</p>
             </div>
             <div className="p-3 rounded-lg border border-border text-center">
               <FileText className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
               <p className="text-xl font-semibold text-foreground">{viewCount > 0 ? Math.ceil(viewCount / 2) : 0}</p>
               <p className="text-xs text-muted-foreground">Dashboards</p>
             </div>
           </div>
 
           <p className="text-sm text-muted-foreground text-center">
             This migration will create corresponding Power BI reports for all selected content.
           </p>
         </div>
 
         <DialogFooter className="gap-2 sm:gap-0">
           <Button variant="outline" onClick={onCancel} disabled={isLoading}>
             Cancel
           </Button>
           <Button variant="powerbi" onClick={onConfirm} disabled={isLoading}>
             {isLoading ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Preparing...
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
 
 export default MigrationPreviewDialog;