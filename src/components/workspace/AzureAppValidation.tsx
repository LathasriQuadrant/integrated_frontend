import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Info, ExternalLink, ShieldCheck } from 'lucide-react';
import { AzureAppStatus } from '@/types/migration';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AzureAppValidationProps {
  workspaceName: string;
  onValidationComplete: (isValid: boolean) => void;
}

const AzureAppValidation = ({ workspaceName, onValidationComplete }: AzureAppValidationProps) => {
  const [status, setStatus] = useState<AzureAppStatus>('checking');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    checkAppAccess();
  }, [workspaceName]);

  const checkAppAccess = () => {
    setStatus('checking');
    // Simulate API validation - in production this would call Power BI API
    setTimeout(() => {
      // Randomly simulate detected or not detected for demo
      const isDetected = Math.random() > 0.5;
      setStatus(isDetected ? 'detected' : 'not_detected');
      onValidationComplete(isDetected);
    }, 2000);
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setStatus('checking');
    setTimeout(() => {
      setStatus('detected');
      setIsRetrying(false);
      onValidationComplete(true);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className={cn(
        "rounded-xl border p-4",
        status === 'checking' && "bg-muted/50 border-border",
        status === 'detected' && "bg-success/5 border-success/20",
        status === 'not_detected' && "bg-warning/5 border-warning/20",
        status === 'error' && "bg-destructive/5 border-destructive/20"
      )}>
        <div className="flex items-start gap-3">
          {status === 'checking' && (
            <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0 mt-0.5" />
          )}
          {status === 'detected' && (
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          )}
          {status === 'not_detected' && (
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          )}

          <div className="flex-1">
            <h4 className="font-medium text-foreground">
              {status === 'checking' && 'Validating Azure AD App Access...'}
              {status === 'detected' && 'Azure AD App Detected'}
              {status === 'not_detected' && 'Azure AD App Not Detected'}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {status === 'checking' && `Checking permissions for "${workspaceName}"`}
              {status === 'detected' && 'The app has the required read/write permissions to proceed with migration.'}
              {status === 'not_detected' && 'The Azure AD App must be added to this workspace before migration can proceed.'}
            </p>

            {status === 'detected' && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-success">
                  <ShieldCheck className="w-4 h-4" />
                  Read Access
                </span>
                <span className="flex items-center gap-1.5 text-success">
                  <ShieldCheck className="w-4 h-4" />
                  Write Access
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions when not detected */}
      {status === 'not_detected' && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">
                Add Azure AD App to Workspace
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                An Azure AD App (service principal) must be added to the selected workspace with read/write permissions via Power BI APIs.
              </p>
            </div>
          </div>

          <div className="pl-8 space-y-3">
            <h5 className="text-sm font-medium text-foreground">Follow these steps:</h5>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Open the selected workspace in Power BI Service</li>
              <li>Click <strong className="text-foreground">Workspace Access</strong> → <strong className="text-foreground">Add Member</strong></li>
              <li>Search for and add the Azure AD App: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">BIMigrationApp</code></li>
              <li>Assign <strong className="text-foreground">Admin</strong> or <strong className="text-foreground">Member</strong> role</li>
              <li>Click "Validate Again" below once complete</li>
            </ol>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://app.powerbi.com', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Power BI Service
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate Again'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AzureAppValidation;
