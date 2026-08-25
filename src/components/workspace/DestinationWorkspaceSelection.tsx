import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileText,
  Database,
  Loader2,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/AppLayout";
import MigrationSummaryDialog from "@/components/workspace/MigrationSummaryDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { useAuth } from "@/contexts/AuthContext";
import { TreeNode } from "@/types/migration";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PowerBICapacity {
  id: string;
  displayName: string;
  state: string;
  admins?: string[];
  sku?: string;
  capacityUserAccessRight?: string;
}

interface PowerBIReport {
  id: string;
  name: string;
}

interface PowerBIDataset {
  id: string;
  name: string;
}

interface PowerBIWorkspace {
  id: string;
  name: string;
  type?: string;
  reports?: PowerBIReport[];
  datasets?: PowerBIDataset[];
}

export interface SelectedPowerBIWorkspace {
  id: string;
  name: string;
}

const BACKEND_BASE_URL = "https://accesstokens-aecjbzaqaqcuh6bd.eastus-01.azurewebsites.net";

const sourceNames: Record<string, string> = {
  tableau: "Tableau",
  microstrategy: "MicroStrategy",
  sapbo: "SAP BusinessObjects",
  cognos: "IBM Cognos",
};

const DestinationWorkspaceSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const nodeInfo = location.state?.node as TreeNode | undefined;
  const sourceId = location.state?.source as string | undefined;
  const sourceName = sourceNames[sourceId || ""] || "Unknown";

  const [workspaces, setWorkspaces] = useState<PowerBIWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "tree">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<SelectedPowerBIWorkspace | null>(null);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [creationProgress, setCreationProgress] = useState("");

  // Get auth state from context
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Capacity state
  const [capacities, setCapacities] = useState<PowerBICapacity[]>([]);
  const [selectedCapacityId, setSelectedCapacityId] = useState<string>("");
  const [isLoadingCapacities, setIsLoadingCapacities] = useState(false);

  // Auto-upload state
  const [isUploading, setIsUploading] = useState(false);

  // Lakehouse password retry state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [lakehousePassword, setLakehousePassword] = useState("");
  const [isRetryingLakehouse, setIsRetryingLakehouse] = useState(false);
  const [pendingLakehousePayload, setPendingLakehousePayload] = useState<{
    file_name: string;
    workspace_id: string;
  } | null>(null);

  const fetchWorkspaces = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch(`${BACKEND_BASE_URL}/workspaces`, {
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        // Token expired or not authenticated - redirect to login
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }

      const data = await response.json();
      // Handle both array response and object with workspaces property
      const workspacesList = Array.isArray(data) ? data : data.workspaces || data.value || [];

      console.log("Workspaces loaded:", workspacesList.length, "workspaces");
      // Log first workspace to verify structure
      if (workspacesList.length > 0) {
        console.log("Sample workspace data:", {
          name: workspacesList[0].name,
          reportsCount: workspacesList[0].reports?.length || 0,
          datasetsCount: workspacesList[0].datasets?.length || 0,
        });
      }

      setWorkspaces(workspacesList);

      if (showRefreshToast) {
        toast({ title: "Refreshed", description: "Workspaces list updated" });
      }
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      setError("Failed to load Power BI workspaces. Please try again.");
      toast({
        title: "Error",
        description: "Could not load Power BI workspaces",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Redirect to login if not authenticated, otherwise fetch workspaces
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      // Not authenticated - redirect to login
      navigate("/login", { replace: true });
      return;
    }

    // Already authenticated via Azure AD - fetch workspaces
    fetchWorkspaces();
  }, [isAuthenticated, isAuthLoading, navigate]);

  const fetchCapacities = async () => {
    setIsLoadingCapacities(true);
    try {
      console.log("Fetching capacities from:", `${BACKEND_BASE_URL}/user-capacities`);
      const response = await fetch(`${BACKEND_BASE_URL}/user-capacities`, {
        credentials: "include",
      });
      console.log("Capacities response status:", response.status);
      const contentType = response.headers.get("content-type");
      console.log("Capacities response content-type:", contentType);

      if (response.ok) {
        const rawText = await response.text();
        console.log("Capacities raw response:", rawText);
        const data = JSON.parse(rawText);
        console.log("Capacities parsed data:", data);
        const caps = Array.isArray(data) ? data : data.value || data.capacities || [];
        console.log("Capacities extracted array:", caps);
        setCapacities(caps);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch capacities:", response.status, errorText);
      }
    } catch (err) {
      console.error("Error fetching capacities:", err);
    } finally {
      setIsLoadingCapacities(false);
    }
  };

  const handleRefresh = () => fetchWorkspaces(true);

  const toggleExpand = (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedWorkspaces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceId)) {
        newSet.delete(workspaceId);
      } else {
        newSet.add(workspaceId);
      }
      return newSet;
    });
  };

  const handleWorkspaceSelect = (workspace: PowerBIWorkspace) => {
    setSelectedWorkspace({ id: workspace.id, name: workspace.name });
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast({
        title: "Workspace name required",
        description: "Please enter a workspace name",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCapacityId) {
      toast({
        title: "Capacity required",
        description: "Please select a capacity",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingWorkspace(true);
      setCreationProgress("Creating workspace...");

      const payload = {
        workspace_name: newWorkspaceName.trim(),
        capacity_id: selectedCapacityId,
      };
      console.log("Creating workspace with payload:", JSON.stringify(payload));

      // Progress timer — backend can take 3+ minutes (create → assign → verify)
      const progressSteps = [
        { time: 5000, msg: "Creating workspace..." },
        { time: 15000, msg: "Assigning to capacity..." },
        { time: 30000, msg: "Waiting for capacity assignment (this may take a minute)..." },
        { time: 60000, msg: "Still assigning capacity, please wait..." },
        { time: 90000, msg: "Verifying capacity assignment..." },
        { time: 120000, msg: "Almost done, verifying workspace..." },
        { time: 150000, msg: "Final verification in progress..." },
      ];
      const timers = progressSteps.map((step) =>
        setTimeout(() => setCreationProgress(step.msg), step.time)
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 min timeout

      const response = await fetch(`${BACKEND_BASE_URL}/workspaces/with-capacity`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      timers.forEach(clearTimeout);

      console.log("Create workspace response status:", response.status);
      const rawText = await response.text();
      console.log("Create workspace raw response:", rawText);
      const result = rawText ? JSON.parse(rawText) : {};

      if (!response.ok) {
        throw new Error(result.detail || "Failed to create workspace");
      }

      toast({
        title: "Workspace Created",
        description: `"${result.workspaceName || newWorkspaceName}" created and assigned to capacity successfully`,
      });

      setIsCreateDialogOpen(false);
      setNewWorkspaceName("");
      setSelectedCapacityId("");
      fetchWorkspaces(true);
    } catch (err) {
      const message = err instanceof Error
        ? err.name === "AbortError"
          ? "Request timed out. The workspace may still be creating — check Power BI portal."
          : err.message
        : "Unable to create workspace";
      toast({
        title: "Creation Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingWorkspace(false);
      setCreationProgress("");
    }
  };

  // Add service principal to workspace
  const addServicePrincipalToWorkspace = async (workspaceId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/workspaces/add-sp`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error("Failed to add service principal:", result);
        // Don't throw - this is a non-blocking operation for now
        return false;
      }

      console.log("Service principal added to workspace successfully");
      return true;
    } catch (err) {
      console.error("Error adding service principal to workspace:", err);
      return false;
    }
  };

  const LAKEHOUSE_URL =
    "https://live-data-lakehouse-erbghyatb6f4awgf.eastus-01.azurewebsites.net/api/v1/lakehouse/migrate";
  const DEPLOY_URL = "https://xmla-semanticmodel-b8gbc7b0daape3fb.eastus-01.azurewebsites.net/api/Deploy";

  const callLakehouseMigrate = async (fileName: string, workspaceId: string, password?: string) => {
    const body: Record<string, string> = { file_name: fileName, workspace_id: workspaceId };
    if (password) body.password = password;

    const res = await fetch(LAKEHOUSE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.detail || data.message || "Lakehouse migration failed");
    }
    return data;
  };

  const callDeploy = async (lakehouseResponse: any, workspaceName: string) => {
    const parsedRaw = sessionStorage.getItem("parsed_workbook_data");
    const modelSchema = parsedRaw ? JSON.parse(parsedRaw) : {};

    const payload = {
      workspaceName,
      lakehouseServer: lakehouseResponse.sql_endpoint_connection,
      lakehouseDatabase: lakehouseResponse.lakehouse_name,
      modelSchema,
    };

    console.log("Deploy payload:", payload);

    const res = await fetch(DEPLOY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Deploy response:", data);
    sessionStorage.setItem("deploy_response", JSON.stringify(data));

    if (!res.ok) {
      throw new Error(data.detail || data.message || "Semantic model deployment failed");
    }
    return data;
  };

  const handleAutoUpload = async () => {
    if (!selectedWorkspace || !nodeInfo) return;

    setIsUploading(true);
    try {
      // 1. Get the user's email (Fallback to dummy for testing if not set)
      const currentUserEmail = sessionStorage.getItem("azure_user_email") || "dummy@dummy.com";

      // 2. Calculate the count once, use it for both Sheets and Dashboards
      const childCount = nodeInfo.children ? nodeInfo.children.length : 0;

      // 3. Create the job in the database FIRST
      const jobPayload = {
        UserId: currentUserEmail,
        ReportName: nodeInfo.name,
        SourcePlatform: sourceNames[sourceId || ""] || "Unknown",
        SourceReportId: String(nodeInfo.id),
        TargetPlatform: "Power BI",
        SheetsCount: childCount,
        DashboardsCount: childCount,
        WorkbooksCount: 1,
      };

      const jobRes = await fetch("https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobPayload),
      });

      if (jobRes.ok) {
        const newJob = await jobRes.json();

        // CRUCIAL: Save the numeric Database ID (e.g., 15) for the update step
        sessionStorage.setItem("current_migration_job_id", newJob.Id.toString());

        // Immediately set it to running
        await fetch(`https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/${newJob.Id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ MigrationStatus: "Running" }),
        });
      }

      // Only add service principal — all other steps moved to Migration page
      await addServicePrincipalToWorkspace(selectedWorkspace.id);

      // Store workspace info in sessionStorage for Migration page
      sessionStorage.setItem("workspace_id", selectedWorkspace.id);
      sessionStorage.setItem("workspace_name", selectedWorkspace.name);

      toast({
        title: "Workspace Ready",
        description: `Service principal added to "${selectedWorkspace.name}"`,
      });

      navigate(`/migrate/${nodeInfo.id}`, {
        state: { node: nodeInfo, source: sourceId, workspace: selectedWorkspace },
      });
    } catch (err) {
      console.error("Migration error:", err);
      toast({
        title: "Migration Failed",
        description: err instanceof Error ? err.message : "Migration process failed",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Password retry removed — handled on Migration page now

  const handleStartMigration = () => {
    if (selectedWorkspace && nodeInfo) {
      navigate(`/migrate/${nodeInfo.id}`, {
        state: {
          node: nodeInfo,
          source: sourceId,
          workspace: selectedWorkspace,
        },
      });
    }
  };

  const filteredWorkspaces = workspaces.filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Show loading while checking auth
  if (isAuthLoading || (!isAuthenticated && !isLoading)) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </AppLayout>
    );
  }

  if (!nodeInfo) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <p className="text-muted-foreground">No report selected. Please go back and select a report.</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ===================== RENDER =====================
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-shrink-0">
          <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <button onClick={() => navigate(-1)} className="hover:text-foreground transition-colors">
            {sourceName} Explorer
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Select Destination</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Power BI Workspaces</h1>
              <p className="text-sm text-muted-foreground">Select destination for "{nodeInfo.name}"</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="powerbi"
              size="sm"
              onClick={() => {
                setIsCreateDialogOpen(true);
                fetchCapacities();
                setSelectedCapacityId("");
                setNewWorkspaceName("");
              }}
            >
              + Create Workspace
            </Button>

            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "tree" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("tree")}>
              <List className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-card rounded-xl border border-border enterprise-shadow flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading Power BI workspaces...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-card rounded-xl border border-border enterprise-shadow flex-1 flex items-center justify-center">
            <div className="text-center py-16">
              <p className="text-destructive text-sm">{error}</p>
              <Button variant="outline" onClick={handleRefresh} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && workspaces.length === 0 && isAuthenticated && (
          <div className="bg-card rounded-xl border border-border enterprise-shadow flex-1 flex items-center justify-center">
            <div className="text-center py-16">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No Power BI workspaces found for your account.</p>
            </div>
          </div>
        )}

        {/* GRID VIEW */}
        {!isLoading && !error && workspaces.length > 0 && viewMode === "grid" && (
          <div className="bg-card rounded-xl border border-border enterprise-shadow flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-border flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleWorkspaceSelect(workspace)}
                    className={`p-4 rounded-lg border text-left ${
                      selectedWorkspace?.id === workspace.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <FolderOpen className="w-5 h-5 mb-2 text-primary" />
                    <p className="font-medium text-sm">{workspace.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {workspace.reports?.length || 0} reports • {workspace.datasets?.length || 0} datasets
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selectedWorkspace && (
              <div className="p-4 border-t border-border flex justify-end flex-shrink-0">
                <Button variant="powerbi" size="lg" onClick={() => setShowMigrationDialog(true)} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading Template...
                    </>
                  ) : (
                    "Migrate to Power BI"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
        {/* TREE VIEW */}
        {!isLoading && !error && workspaces.length > 0 && viewMode === "tree" && (
          <div className="bg-card rounded-xl border border-border enterprise-shadow flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-border flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="py-2">
                {filteredWorkspaces.map((workspace) => {
                  const isExpanded = expandedWorkspaces.has(workspace.id);
                  const isSelected = selectedWorkspace?.id === workspace.id;
                  const reports = workspace.reports || [];
                  const datasets = workspace.datasets || [];
                  const hasContent = reports.length > 0 || datasets.length > 0;

                  return (
                    <div key={workspace.id}>
                      <button
                        onClick={() => handleWorkspaceSelect(workspace)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-accent/50 ${
                          isSelected ? "bg-accent text-accent-foreground font-medium" : ""
                        }`}
                        style={{ paddingLeft: "12px" }}
                      >
                        <span className="w-4 h-4 flex items-center justify-center shrink-0">
                          {hasContent && (
                            <button
                              onClick={(e) => toggleExpand(workspace.id, e)}
                              className="hover:bg-muted rounded p-0.5"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          )}
                        </span>
                        <FolderOpen className="w-4 h-4 text-primary" />
                        <span className="truncate">{workspace.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">Workspace</span>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && hasContent && (
                        <div className="tree-expand">
                          {/* Reports */}
                          {reports.map((report) => (
                            <div
                              key={report.id}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
                              style={{ paddingLeft: "44px" }}
                            >
                              <FileText className="w-4 h-4 text-success" />
                              <span className="truncate">{report.name}</span>
                              <span className="ml-auto text-xs">Report</span>
                            </div>
                          ))}
                          {/* Datasets */}
                          {datasets.map((dataset) => (
                            <div
                              key={dataset.id}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
                              style={{ paddingLeft: "44px" }}
                            >
                              <Database className="w-4 h-4 text-info" />
                              <span className="truncate">{dataset.name}</span>
                              <span className="ml-auto text-xs">Dataset</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedWorkspace && (
              <div className="p-4 border-t border-border flex justify-end">
                <Button variant="powerbi" size="lg" onClick={() => setShowMigrationDialog(true)} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading Template...
                    </>
                  ) : (
                    "Migrate to Power BI"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Migration Summary Dialog */}
      <MigrationSummaryDialog
        open={showMigrationDialog}
        onOpenChange={setShowMigrationDialog}
        sourceNode={nodeInfo}
        sourceName={sourceName}
        destinationWorkspace={selectedWorkspace}
        onConfirm={handleAutoUpload}
        isLoading={isUploading}
      />

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (open) {
            fetchCapacities();
            setSelectedCapacityId("");
            setNewWorkspaceName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Power BI Workspace</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace Name</label>
              <Input
                placeholder="Enter workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Capacity</label>
              {isLoadingCapacities ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading capacities...
                </div>
              ) : capacities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No capacities available.</p>
              ) : (
                <Select value={selectedCapacityId} onValueChange={setSelectedCapacityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    {capacities.map((cap) => {
                      const hasAccess = cap.capacityUserAccessRight && cap.capacityUserAccessRight !== "None";
                      const isActive = cap.state === "Active";
                      const isDisabled = !hasAccess || !isActive;

                      const skuLabelMap: Record<string, string> = {
                        F2: "Fabric Capacity",
                        F4: "Fabric Capacity",
                        F8: "Fabric Capacity",
                        F16: "Fabric Capacity",
                        F32: "Fabric Capacity",
                        F64: "Fabric Capacity",
                        F128: "Fabric Capacity",
                        F256: "Fabric Capacity",
                        F512: "Fabric Capacity",
                        F1024: "Fabric Capacity",
                        F2048: "Fabric Capacity",
                        FTL64: "Trial Fabric",
                        PP3: "Premium Per User",
                        P1: "Premium Capacity",
                        P2: "Premium Capacity",
                        P3: "Premium Capacity",
                        P4: "Premium Capacity",
                        P5: "Premium Capacity",
                      };
                      const skuLabel = cap.sku ? skuLabelMap[cap.sku] || cap.sku : "";

                      return (
                        <SelectItem key={cap.id} value={cap.id} disabled={isDisabled}>
                          <div className="flex flex-col">
                            <span>
                              {cap.displayName}
                              {skuLabel ? ` (${skuLabel})` : ""}
                            </span>
                            {isDisabled && (
                              <span className="text-xs text-muted-foreground">
                                {!isActive ? "Inactive" : "No access"}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="powerbi"
              onClick={handleCreateWorkspace}
              disabled={isCreatingWorkspace || !selectedCapacityId || !newWorkspaceName.trim()}
            >
              {isCreatingWorkspace ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {creationProgress || "Creating..."}
                </span>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DestinationWorkspaceSelection;
