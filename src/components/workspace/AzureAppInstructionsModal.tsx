import { useState } from "react";
import { ExternalLink, CheckCircle2, Copy, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AzureAppInstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

const AzureAppInstructionsModal = ({ open, onOpenChange, onContinue }: AzureAppInstructionsModalProps) => {
  const { toast } = useToast();
  const [acknowledged, setAcknowledged] = useState(false);

  const azureAppId = "Tableau_PowerBI_Migration_App"; // This would come from config

  const handleCopyAppId = () => {
    navigator.clipboard.writeText(azureAppId);
    toast({
      title: "Copied",
      description: "Azure App ID copied to clipboard",
    });
  };

  const handleContinue = () => {
    onContinue();
    onOpenChange(false);
    setAcknowledged(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle>Azure AD App Configuration</DialogTitle>
          </div>
          <DialogDescription>
            Before migrating, ensure the Azure AD App has access to your Power BI workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Follow these steps:</h4>

            <div className="space-y-2">
              <div className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <div>
                  <p>Open Power BI Service and navigate to your destination workspace</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-primary"
                    onClick={() => window.open("https://app.powerbi.com", "_blank")}
                  >
                    Open Power BI Service <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <p>
                  Go to <strong>Workspace Settings → Access</strong>
                </p>
              </div>

              <div className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <div>
                  <p>
                    Add the Azure AD App with <strong>Contributor</strong> or <strong>Admin</strong> access
                  </p>
                  <div className="mt-2 flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                    <code className="text-xs flex-1 truncate">{azureAppId}</code>
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleCopyAppId}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                  4
                </span>
                <p>
                  Click <strong>Add</strong> and save the changes
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="pt-2 border-t border-border">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 rounded border-border"
              />
              <span className="text-sm text-muted-foreground">
                I have added the Azure AD App to my destination Power BI workspace with the required permissions.
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!acknowledged} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Continue to Workspace Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AzureAppInstructionsModal;
