import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  ChevronRight,
  LayoutGrid,
  List,
  BookOpen,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import TreeView from "@/components/explorer/TreeView";
import AppLayout from "@/components/layout/AppLayout";
import { sampleTableauTree } from "@/data/sampleTree";
import { TreeNode } from "@/types/migration";
import { buildTableauTree } from "@/data/tableauTreeMapper";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Integrated backend (existing Tableau routes + new Pre-Migration AI
// Analysis routes) now runs as a single local app. Override with
// VITE_TABLEAU_BACKEND_URL for a non-local deployment.
const TABLEAU_BACKEND_URL = import.meta.env.VITE_TABLEAU_BACKEND_URL || "http://localhost:8000";

const sourceNames: Record<string, string> = {
  tableau: "Tableau",
  microstrategy: "MicroStrategy",
  sapbo: "SAP BusinessObjects",
  cognos: "IBM Cognos",
};

interface WorkbookItem {
  id: string;
  name: string;
  projectName: string;
  viewCount: number;
}

const Explorer = () => {
  const { sourceId } = useParams<{ sourceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [selectedWorkbook, setSelectedWorkbook] = useState<WorkbookItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [treeData, setTreeData] = useState<TreeNode[]>(sampleTableauTree);
  const [workbooks, setWorkbooks] = useState<WorkbookItem[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "tree">("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // ---------------- Pre-Migration Analysis selection ----------------
  const [analysisSelection, setAnalysisSelection] = useState<Set<string>>(new Set());

  const sourceName = sourceNames[sourceId || ""] || "Unknown";

  // ---------------- Extract workbooks for Grid View ----------------
  const extractWorkbooks = (tree: TreeNode[]): WorkbookItem[] => {
    const list: WorkbookItem[] = [];

    const traverse = (nodes: TreeNode[], projectName = "") => {
      nodes.forEach((node) => {
        if (node.type === "project" && node.children) {
          traverse(node.children, node.name);
        } else if (node.type === "workbook") {
          list.push({
            id: node.id,
            name: node.name,
            projectName,
            viewCount: node.children?.length || 0,
          });
        } else if (node.children) {
          traverse(node.children, projectName);
        }
      });
    };

    traverse(tree);
    return list;
  };

  // ---------------- Load Tableau Tree ----------------
  useEffect(() => {
    if (sourceId === "tableau") {
      const storedTree = sessionStorage.getItem("tableau_tree");
      if (storedTree) {
        const parsed = JSON.parse(storedTree);
        setTreeData(parsed);
        setWorkbooks(extractWorkbooks(parsed));
      }
    }
  }, [sourceId]);

  // ---------------- Refresh ----------------
  const handleRefresh = async () => {
    if (sourceId !== "tableau") return;

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

    setIsRefreshing(true);
    try {
      const response = await fetch(
        `${TABLEAU_BACKEND_URL}/tableau/fetch_data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_token: token }),
        },
      );

      const data = await response.json();
      const newTree = buildTableauTree(data);

      sessionStorage.setItem("tableau_tree", JSON.stringify(newTree));
      setTreeData(newTree);
      setWorkbooks(extractWorkbooks(newTree));

      toast({ title: "Refreshed", description: "Tableau content updated" });
    } catch {
      toast({
        title: "Refresh failed",
        description: "Could not refresh Tableau content",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // ---------------- Migration Steps ----------------
  const runMigrationSteps = async (workbookId: string, workbookName: string) => {
    const token = sessionStorage.getItem("tableau_api_token");
    if (!token) {
      toast({ title: "Session expired", description: "Please sign in again", variant: "destructive" });
      navigate("/");
      return null;
    }
    const BASE = `${TABLEAU_BACKEND_URL}/tableau`;

    const dlRes = await fetch(`${BASE}/download_workbook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_token: token, workbook_id: workbookId, file_name: `${workbookName}.twbx` }),
    });
    if (!dlRes.ok) throw new Error("Failed to download workbook");
    const dlData = await dlRes.json();
    console.log("Workbook downloaded:", dlData);
    return true;
  };

  // ---------------- Navigation ----------------
  const handleMigrateWorkbook = async () => {
    if (!selectedWorkbook) return;

    const findNode = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === selectedWorkbook.id) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const workbookNode = findNode(treeData);
    if (!workbookNode) return;

    setIsMigrating(true);

    try {
      await runMigrationSteps(selectedWorkbook.id, selectedWorkbook.name);
      sessionStorage.setItem("selected_workbook", JSON.stringify(selectedWorkbook));

      toast({
        title: "Preparation complete",
        description: "Ready to select destination workspace",
      });

      navigate("/workspace-selection", {
        state: { node: workbookNode, source: sourceId },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Migration preparation failed";
      toast({
        title: "Migration failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleMigrateNode = async () => {
    if (!selectedNode) return;

    setIsMigrating(true);

    try {
      await runMigrationSteps(selectedNode.id, selectedNode.name);
      sessionStorage.setItem(
        "selected_workbook",
        JSON.stringify({ id: selectedNode.id, name: selectedNode.name, type: selectedNode.type }),
      );

      toast({
        title: "Preparation complete",
        description: "Ready to select destination workspace",
      });

      navigate("/workspace-selection", {
        state: { node: selectedNode, source: sourceId },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Migration preparation failed";
      toast({
        title: "Migration failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // ---------------- Pre-Migration Analysis selection ----------------
  const toggleAnalysisSelection = (workbookId: string) => {
    setAnalysisSelection((prev) => {
      const next = new Set(prev);
      if (next.has(workbookId)) {
        next.delete(workbookId);
      } else {
        next.add(workbookId);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setAnalysisSelection((prev) => {
      const next = new Set(prev);
      filteredWorkbooks.forEach((wb) => next.add(wb.id));
      return next;
    });
  };

  const clearAnalysisSelection = () => setAnalysisSelection(new Set());

  const handleAnalyzeSelected = () => {
    if (analysisSelection.size === 0 || sourceId !== "tableau") return;

    const token = sessionStorage.getItem("tableau_api_token");
    if (!token) {
      toast({ title: "Session expired", description: "Please sign in again", variant: "destructive" });
      navigate("/");
      return;
    }

    const selectedWorkbooks = workbooks.filter((wb) => analysisSelection.has(wb.id));

    navigate("/pre-migration-analysis", {
      state: {
        workbookIds: selectedWorkbooks.map((wb) => wb.id),
        workbookNames: selectedWorkbooks.map((wb) => wb.name),
      },
    });
  };

  const filteredWorkbooks = workbooks.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.projectName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ============================== UI ==============================
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-shrink-0">
          <button onClick={() => navigate("/")}>Dashboard</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{sourceName} Explorer</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{sourceName} Workbooks</h1>
              <p className="text-sm text-muted-foreground">Select content to migrate to Power BI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "tree" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("tree")}>
              <List className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ================= GRID VIEW ================= */}
        {viewMode === "grid" && (
          <div className="bg-card rounded-xl border border-border enterprise-shadow flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-border flex-shrink-0 space-y-3">
              <Input
                placeholder="Search workbooks or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Pre-Migration Analysis selection toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllVisible} disabled={filteredWorkbooks.length === 0}>
                    <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAnalysisSelection}
                    disabled={analysisSelection.size === 0}
                  >
                    <Square className="w-3.5 h-3.5 mr-1.5" />
                    Clear Selection
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {analysisSelection.size} workbook{analysisSelection.size === 1 ? "" : "s"} selected
                  </span>
                </div>

                <Button size="sm" onClick={handleAnalyzeSelected} disabled={analysisSelection.size === 0}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Analyze Selected Workbooks
                </Button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredWorkbooks.map((wb) => {
                  const checked = analysisSelection.has(wb.id);
                  return (
                    <div
                      key={wb.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedWorkbook(wb)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedWorkbook(wb)}
                      className={`relative p-4 rounded-lg border text-left cursor-pointer ${
                        selectedWorkbook?.id === wb.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleAnalysisSelection(wb.id)}
                          aria-label={`Select ${wb.name} for analysis`}
                        />
                      </div>
                      <BookOpen className="w-5 h-5 mb-2" />
                      <p className="font-medium text-sm pr-6">{wb.name}</p>
                      <p className="text-xs text-muted-foreground">{wb.projectName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{wb.viewCount} view{wb.viewCount === 1 ? "" : "s"}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedWorkbook && (
              <div className="p-4 border-t border-border flex justify-end flex-shrink-0">
                <Button size="lg" onClick={handleMigrateWorkbook} disabled={isMigrating}>
                  {isMigrating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing Migration...
                    </>
                  ) : (
                    "Migrate to Power BI"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ================= TREE VIEW ================= */}
        {viewMode === "tree" && (
          <div className="bg-card rounded-xl border border-border enterprise-shadow flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-border flex-shrink-0">
              <Input
                placeholder="Search reports, dashboards, workbooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <TreeView nodes={treeData} selectedId={selectedNode?.id || null} onSelect={setSelectedNode} />
            </div>

            {selectedNode && (
              <div className="p-4 border-t border-border flex justify-end flex-shrink-0">
                <Button size="lg" onClick={handleMigrateNode} disabled={isMigrating}>
                  {isMigrating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing Migration...
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
    </AppLayout>
  );
};

export default Explorer;
