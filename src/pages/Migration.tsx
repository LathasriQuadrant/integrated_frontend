import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Circle, Loader2, XCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MigrationStep, MigrationStatus } from "@/types/migration";
import { cn } from "@/lib/utils";

/* ============================================================
   Steps (UI remains unchanged)
============================================================ */
const initialSteps: MigrationStep[] = [
  { id: "step-1", name: "Metadata Extraction", description: "Waiting", status: "pending" },
  { id: "step-2", name: "Artifact Generation", description: "Waiting", status: "pending" },
  { id: "step-3", name: "Dataset & Report Creation", description: "Waiting", status: "pending" },
  { id: "step-4", name: "Deployment", description: "Waiting", status: "pending" },
  { id: "step-5", name: "Validation", description: "Waiting", status: "pending" },
];

const stepIcon = (s: MigrationStatus) => {
  if (s === "completed") return <CheckCircle2 className="text-green-600" />;
  if (s === "running") return <Loader2 className="animate-spin text-blue-600" />;
  if (s === "failed") return <XCircle className="text-red-600" />;
  return <Circle className="text-gray-400" />;
};

const LAKEHOUSE_URL =
  "https://live-data-lakehouse-erbghyatb6f4awgf.eastus-01.azurewebsites.net/api/v1/lakehouse/migrate";
const DEPLOY_URL = "https://xmla-semanticmodel-b8gbc7b0daape3fb.eastus-01.azurewebsites.net/api/Deploy";

export default function Migration() {
  const navigate = useNavigate();
  const location = useLocation();

  const nodeInfo = location.state?.node;
  const workspace = location.state?.workspace;
  const raw = sessionStorage.getItem("selected_workbook");
  const selectedWorkbook = raw ? JSON.parse(raw) : null;
  const reportName: string | undefined = selectedWorkbook?.name;

  const [steps, setSteps] = useState<MigrationStep[]>(initialSteps);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Password dialog state for lakehouse
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [lakehousePassword, setLakehousePassword] = useState("");
  const [isRetryingLakehouse, setIsRetryingLakehouse] = useState(false);
  const [passwordResolve, setPasswordResolve] = useState<((password: string | null) => void) | null>(null);

  const log = (msg: string) => console.log(`[Migration] ${msg}`);

  const updateStep = (index: number, status: MigrationStatus, desc?: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status, description: desc ?? s.description } : s)));
  };

  // Helper to mark job as failed in the DB if this page crashes
  const updateJobToFailed = async (errorMessage: string) => {
    const currentJobId = sessionStorage.getItem("current_migration_job_id");
    if (currentJobId) {
      try {
        await fetch(`https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/${currentJobId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            MigrationStatus: "Failed",
            ErrorMessage: errorMessage,
            CompletedAt: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error("Could not update database with failure status:", e);
      }
    }
  };

  // Prompt user for password and return it (or null if cancelled)
  const promptForPassword = (): Promise<string | null> => {
    return new Promise((resolve) => {
      setPasswordResolve(() => resolve);
      setShowPasswordDialog(true);
    });
  };

  const handlePasswordSubmit = () => {
    if (passwordResolve) {
      passwordResolve(lakehousePassword.trim() || null);
      setPasswordResolve(null);
    }
    setShowPasswordDialog(false);
    setLakehousePassword("");
  };

  const handlePasswordCancel = () => {
    if (passwordResolve) {
      passwordResolve(null);
      setPasswordResolve(null);
    }
    setShowPasswordDialog(false);
    setLakehousePassword("");
  };

  /* ============================================================
     Migration Orchestrator
  ============================================================ */
  useEffect(() => {
    if (!reportName || !nodeInfo) return;

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const workspaceId = workspace?.id || sessionStorage.getItem("workspace_id") || "";
    const workspaceName = workspace?.name || sessionStorage.getItem("workspace_name") || "";

    const run = async () => {
      // ── Step 1 – Metadata Extraction (3 real API calls) ──
      updateStep(0, "running", "Parsing workbook…");
      try {
        // 1a) Parse workbook
        const filename = reportName.replace(/\.twbx$/i, "");
        const parseRes = await fetch(
          `https://frame-tomgenerator-test-hqf5dvhjbgd0hqht.eastus-01.azurewebsites.net/parse/${encodeURIComponent(filename)}`,
          { method: "POST", headers: { accept: "application/json" } },
        );
        if (!parseRes.ok) throw new Error(`Parse failed (${parseRes.status})`);
        const parseData = await parseRes.json();
        console.log("Parse response:", parseData);
        sessionStorage.setItem("parsed_workbook_data", JSON.stringify(parseData));
        updateStep(0, "running", "Uploading report…");

        // 1b) Upload report
        const uploadRes = await fetch(
          "https://report-uploader-awa8avchh6gqa3ad.eastus-01.azurewebsites.net/upload-report",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", accept: "application/json" },
            body: JSON.stringify({ workspace_id: workspaceId, report_name: reportName }),
          },
        );
        if (!uploadRes.ok) throw new Error(`Upload report failed (${uploadRes.status})`);
        const uploadResult = await uploadRes.json();
        console.log("Upload report response:", uploadResult);

        // Store upload response in sessionStorage (same keys as before)
        sessionStorage.setItem("upload_response", JSON.stringify(uploadResult));
        sessionStorage.setItem("upload_message", uploadResult.message || "");
        sessionStorage.setItem("upload_workspace_id", uploadResult.workspace_id || workspaceId);
        sessionStorage.setItem("upload_report_name", uploadResult.report_name || reportName);
        sessionStorage.setItem("upload_report_id", uploadResult.report_id || "");
        sessionStorage.setItem("upload_dataset_id", uploadResult.dataset_id || "");
        // Legacy keys
        sessionStorage.setItem("report_name", uploadResult.report_name || reportName);
        sessionStorage.setItem("report_id", uploadResult.report_id || "");
        sessionStorage.setItem("workspace_id", uploadResult.workspace_id || workspaceId);
        sessionStorage.setItem("workspace_name", workspaceName);

        updateStep(0, "running", "Extracting metadata…");

        // 1c) Extract metadata
        const metaRes = await fetch(
          `https://frame-metadata-test-c3h3ajftb7b0edek.eastus-01.azurewebsites.net/extract-metadata?folder_name=${encodeURIComponent(reportName)}`,
          { method: "POST" },
        );
        if (!metaRes.ok) throw new Error(`Metadata extraction failed (${metaRes.status})`);
        const metaData = await metaRes.json();
        console.log("Metadata extraction response:", metaData);
        sessionStorage.setItem("metadata_response", JSON.stringify(metaData));
        if (metaData.outputBlobUrl) {
          sessionStorage.setItem("metadataOutputBlobUrl", metaData.outputBlobUrl);
          console.log("Stored metadataOutputBlobUrl:", metaData.outputBlobUrl);
        }

        updateStep(0, "completed", "Metadata Extraction completed");
      } catch (err: any) {
        log("Step 1 error: " + err.message);
        updateStep(0, "failed", err.message);
        setFatalError(err.message);
        await updateJobToFailed(err.message); // <-- UPDATE DB
        return;
      }

      // ── Step 2 – Artifact Generation (auto-complete) ──
      updateStep(1, "running", "Processing…");
      await delay(1200);
      updateStep(1, "completed", "Artifact Generation completed");

      // ── Step 3 – Dataset & Report Creation (2 real API calls) ──
      updateStep(2, "running", "Migrating to Lakehouse…");
      try {
        const fileName = `${reportName}.twbx`;

        // 3a) Lakehouse migrate (2 automatic attempts, then password prompt)
        const lakehouseBody: Record<string, string> = { file_name: fileName, workspace_id: workspaceId };

        const postLakehouse = async (payload: Record<string, string>) => {
          const res = await fetch(LAKEHOUSE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", accept: "application/json" },
            body: JSON.stringify(payload),
          });

          let data: any = {};
          try {
            data = await res.json();
          } catch {
            data = {};
          }

          return { res, data };
        };

        const getLakehouseError = (data: any, status: number) =>
          data?.detail || data?.message || `Lakehouse migration failed (${status})`;

        let lakehouseRes: Response | null = null;
        let lakehouseData: any = {};
        let isLakehouseSuccess = false;

        for (let attempt = 1; attempt <= 2; attempt += 1) {
          updateStep(2, "running", `Migrating to Lakehouse… (attempt ${attempt}/2)`);
          const { res, data } = await postLakehouse(lakehouseBody);
          lakehouseRes = res;
          lakehouseData = data;

          if (res.ok && data?.status === "success") {
            isLakehouseSuccess = true;
            break;
          }

          log(`Lakehouse attempt ${attempt} failed: ${getLakehouseError(data, res.status)}`);
        }

        if (!isLakehouseSuccess) {
          log("Lakehouse failed twice, prompting for password…");
          updateStep(2, "running", "Password required – waiting for input…");

          const password = await promptForPassword();
          if (!password) {
            throw new Error("Password entry cancelled by user");
          }

          updateStep(2, "running", "Retrying Lakehouse migration with password…");
          const { res, data } = await postLakehouse({ ...lakehouseBody, password });
          lakehouseRes = res;
          lakehouseData = data;
          isLakehouseSuccess = res.ok && data?.status === "success";
        }

        if (!isLakehouseSuccess || !lakehouseRes) {
          throw new Error(getLakehouseError(lakehouseData, lakehouseRes?.status ?? 500));
        }

        console.log("Lakehouse migration successful:", lakehouseData);
        sessionStorage.setItem("lakehouse_response", JSON.stringify(lakehouseData));

        // 3b) Deploy semantic model
        updateStep(2, "running", "Deploying semantic model…");
        const parsedRaw = sessionStorage.getItem("parsed_workbook_data");
        const modelSchema = parsedRaw ? JSON.parse(parsedRaw) : {};

        const deployPayload = {
          workspaceName,
          lakehouseServer: lakehouseData.sql_endpoint_connection,
          lakehouseDatabase: lakehouseData.lakehouse_name,
          modelSchema,
        };
        console.log("Deploy payload:", deployPayload);

        const deployRes = await fetch(DEPLOY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify(deployPayload),
        });
        const deployData = await deployRes.json();
        console.log("Deploy response:", deployData);
        sessionStorage.setItem("deploy_response", JSON.stringify(deployData));

        if (!deployRes.ok) {
          throw new Error(deployData.detail || deployData.message || "Semantic model deployment failed");
        }

        updateStep(2, "completed", "Dataset & Report Creation completed");
      } catch (err: any) {
        log("Step 3 error: " + err.message);
        updateStep(2, "failed", err.message);
        setFatalError(err.message);
        await updateJobToFailed(err.message); // <-- UPDATE DB
        return;
      }

      // ── Step 4 – Deployment (auto-complete) ──
      updateStep(3, "running", "Processing…");
      await delay(1200);
      updateStep(3, "completed", "Deployment completed");

      // ── Step 5 – Validation (auto-complete) ──
      updateStep(4, "running", "Validating…");
      await delay(1200);
      updateStep(4, "completed", "Validation completed");

      log("Migration flow completed");
      setIsComplete(true);
    };

    run();
  }, [reportName, nodeInfo]);

  return (
    <AppLayout>
      <div className="px-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">Migration Progress</h1>
        </div>

        {fatalError && (
          <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded">
            <b>Error:</b> {fatalError}
          </div>
        )}

        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
          {steps.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex gap-4 p-4 border-b last:border-b-0",
                s.status === "running" && "bg-blue-50",
                s.status === "failed" && "bg-red-50",
              )}
            >
              {stepIcon(s.status)}
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">{s.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => navigate("/preview")}
            disabled={!isComplete}
            className="gap-2 w-full sm:w-auto"
            size="lg"
          >
            View Migrated Report
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Lakehouse Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          if (!open) handlePasswordCancel();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The data source requires authentication. Please enter the password to continue the migration.
          </p>
          <Input
            type="password"
            placeholder="Enter password"
            value={lakehousePassword}
            onChange={(e) => setLakehousePassword(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handlePasswordSubmit();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={handlePasswordCancel}>
              Cancel
            </Button>
            <Button variant="default" onClick={handlePasswordSubmit} disabled={!lakehousePassword.trim()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
