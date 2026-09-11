import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle, RefreshCw, Boxes } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ArtifactsCountModal from "@/components/analysis/ArtifactsCountModal";
import { discoveryApi, DiscoveryResponse } from "@/api/discoveryApi";

interface NavState {
  workbookIds: string[];
  workbookNames: string[];
}

/**
 * Component that:
 * 1. Calls /discovery endpoint with workbook IDs
 * 2. Fetches metadata for all selected workbooks
 * 3. Shows ArtifactsCountModal for each workbook
 */
function PreMigrationAnalysisWithDiscovery() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const navState = location.state as NavState | null;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discoveries, setDiscoveries] = useState<DiscoveryResponse[]>([]);
  const [activeWorkbookIndex, setActiveWorkbookIndex] = useState(0);
  const [showArtifactsModal, setShowArtifactsModal] = useState(false);

  // Fetch workbook discovery data
  const fetchDiscovery = async () => {
    const token = sessionStorage.getItem("tableau_api_token");
    if (!token) {
      toast({
        title: "Session expired",
        description: "Please sign in again",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call /discovery endpoint for each workbook
      const discoveryPromises = navState?.workbookIds?.map((workbookId) =>
        discoveryApi.getWorkbookDiscovery({
          apiToken: token,
          workbookIds: [workbookId],
          siteContentUrl: "default",
        })
      ) || [];

      const results = await Promise.all(discoveryPromises);
      setDiscoveries(results);

      // Show modal automatically for first workbook
      if (results.length > 0) {
        setTimeout(() => setShowArtifactsModal(true), 500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch workbook discovery";
      setError(message);
      toast({
        title: "Discovery failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (!navState?.workbookIds || navState.workbookIds.length === 0) {
      navigate("/dashboard");
      return;
    }
    fetchDiscovery();
  }, []);

  // Get current workbook data
  const currentDiscovery = discoveries[activeWorkbookIndex];
  const currentWorkbook = currentDiscovery?.workbooks[0];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Discovering workbook metadata...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Discovery Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button onClick={fetchDiscovery}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Pre-Migration Analysis</h1>
            <p className="text-muted-foreground mt-1">
              Analyzing {discoveries.length} workbook{discoveries.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchDiscovery} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Workbook Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {discoveries.map((discovery, index) => {
            const wb = discovery.workbooks[0];
            if (!wb) return null;

            return (
              <div
                key={wb.workbook_metadata.id}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  activeWorkbookIndex === index
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => {
                  setActiveWorkbookIndex(index);
                  setTimeout(() => setShowArtifactsModal(true), 100);
                }}
              >
                <h3 className="font-semibold mb-2">{wb.workbook_metadata.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Updated {new Date(wb.workbook_metadata.updated_at).toLocaleDateString()}
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">Dashboards:</span>
                    <p className="font-semibold">{wb.reports.dashboards?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Worksheets:</span>
                    <p className="font-semibold">{wb.reports.worksheets?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Datasources:</span>
                    <p className="font-semibold">{wb.data_model.datasources?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fields:</span>
                    <p className="font-semibold">
                      {(wb.fields.dimensions?.length || 0) + (wb.fields.measures?.length || 0)}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveWorkbookIndex(index);
                    setTimeout(() => setShowArtifactsModal(true), 100);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <Boxes className="w-4 h-4" />
                  View Details
                </Button>
              </div>
            );
          })}
        </div>

        {/* Artifacts Modal */}
        {currentWorkbook && (
          <ArtifactsCountModal
            open={showArtifactsModal}
            onOpenChange={setShowArtifactsModal}
            workbook={{
              workbook_metadata: currentWorkbook.workbook_metadata,
              reports: currentWorkbook.reports,
              usage: currentWorkbook.usage,
              data_model: currentWorkbook.data_model,
              fields: currentWorkbook.fields,
              kpis: currentWorkbook.kpis,
              dependencies: currentWorkbook.dependencies,
              components: currentWorkbook.components,
              mappings: currentWorkbook.mappings,
              visuals: currentWorkbook.visuals,
            }}
            workbookName={currentWorkbook.workbook_metadata.name}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default PreMigrationAnalysisWithDiscovery;
