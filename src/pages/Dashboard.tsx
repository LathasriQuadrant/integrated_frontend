import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileStack, CheckCircle2, History, LayoutGrid, Clock } from "lucide-react";
import SourceCard from "@/components/dashboard/SourceCard";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import TableauAuthModal from "@/components/workspace/TableauAuthModal";
import { TableauIcon, MicroStrategyIcon, SAPBOIcon, CognosIcon } from "@/components/icons/SourceIcons";

// 1. Define the Job structure matching your FastAPI schema
interface MigrationJob {
  Id: number;
  UserId: string;
  ReportName: string;
  ReportPath: string | null;
  SourceReportId: string | null;
  SourcePlatform: string;
  TargetPlatform: string;
  MigrationStatus: string;
  ErrorMessage: string | null;
  StartedAt: string;
  CompletedAt: string | null;
  DurationMinutes: number | null;
  SheetsCount: number;
  DashboardsCount: number;
  WorkbooksCount: number;
}

const migrationSources = [
  {
    id: "tableau",
    title: "Tableau → Power BI",
    description: "Migrate workbooks, dashboards, and data sources from Tableau Server or Online",
    icon: <TableauIcon className="w-5 h-5" />,
    color: "#E97627",
  },
  {
    id: "microstrategy",
    title: "MicroStrategy → Power BI",
    description: "Convert MicroStrategy reports and dossiers to Power BI format",
    icon: <MicroStrategyIcon className="w-5 h-5" />,
    color: "#CC2131",
  },
  {
    id: "sapbo",
    title: "SAP BO → Power BI",
    description: "Migrate SAP BusinessObjects universes and Web Intelligence reports",
    icon: <SAPBOIcon className="w-5 h-5" />,
    color: "#0FAAFF",
  },
  {
    id: "cognos",
    title: "Cognos → Power BI",
    description: "Transform IBM Cognos Analytics reports and dashboards",
    icon: <CognosIcon className="w-5 h-5" />,
    color: "#054ADA",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [showTableauAuth, setShowTableauAuth] = useState(false);

  // State for holding API data
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. FIXED VARIABLE: Change this later when user auth is ready!
  const CURRENT_USER_EMAIL = sessionStorage.getItem("azure_user_email") || "dummy@dummy.com";

  // 3. Fetch data from your live Azure Backend
  useEffect(() => {
    // Don't clear powerbi_authenticated — it breaks auth state
    sessionStorage.removeItem("selected_workbook");

    const fetchJobs = async () => {
      try {
        const userId = encodeURIComponent(CURRENT_USER_EMAIL);
        const response = await fetch(
          `https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/user/${userId}`,
        );
        console.log(response);

        if (response.ok) {
          const data = await response.json();
          // Sort so newest items appear first in the table
          const sortedData = data.sort(
            (a: MigrationJob, b: MigrationJob) => new Date(b.StartedAt).getTime() - new Date(a.StartedAt).getTime(),
          );
          setJobs(sortedData);
        } else {
          console.error("Failed to fetch jobs");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleSourceClick = (sourceId: string) => {
    if (sourceId === "tableau") {
      // Skip auth modal if already signed into Tableau this session
      const hasTableauSession = sessionStorage.getItem("tableau_api_token");
      if (hasTableauSession) {
        navigate("/explore/tableau");
      } else {
        setShowTableauAuth(true);
      }
    } else {
      navigate(`/explore/${sourceId}`);
    }
  };

  const handleTableauAuthSuccess = () => {
    setShowTableauAuth(false);
    navigate("/explore/tableau");
  };

  // 4. --- Dynamic Stat Calculations ---
  const totalMigrations = jobs.length;
  const completedJobs = jobs.filter((j) => j.MigrationStatus === "Completed").length;
  const inProgressJobs = jobs.filter((j) => j.MigrationStatus === "Running").length;

  const totalSheets = jobs.reduce((sum, j) => sum + (j.SheetsCount || 0), 0);
  const totalDashboards = jobs.reduce((sum, j) => sum + (j.DashboardsCount || 0), 0);
  const totalWorkbooks = jobs.reduce((sum, j) => sum + (j.WorkbooksCount || 0), 0);
  const totalAssets = totalSheets + totalDashboards + totalWorkbooks;

  const completedWithDuration = jobs.filter((j) => j.DurationMinutes != null);
  const avgDuration =
    completedWithDuration.length > 0
      ? (completedWithDuration.reduce((sum, j) => sum + j.DurationMinutes!, 0) / completedWithDuration.length).toFixed(
          1,
        )
      : "0";

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Migration Control Center</h1>
            <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Monitor and manage your BI report migrations to Power BI</p>
          <div className="mt-4 h-px bg-border" />
        </div>

        {/* Stats Cards (Wired to dynamic data) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatsCard
            title="Total Migrations"
            value={isLoading ? "..." : totalMigrations.toString()}
            change="All time"
            changeType="neutral"
            icon={<FileStack className="w-5 h-5" />}
          />
          <StatsCard
            title="Migration Status"
            value={isLoading ? "..." : `${completedJobs} / ${inProgressJobs}`}
            change={`${completedJobs} completed, ${inProgressJobs} in progress`}
            changeType={inProgressJobs > 0 ? "positive" : "neutral"}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Assets"
            value={isLoading ? "..." : totalAssets.toString()}
            change={`${totalSheets} sheets, ${totalDashboards} dash, ${totalWorkbooks} books`}
            changeType="neutral"
            icon={<LayoutGrid className="w-5 h-5" />}
          />
          <StatsCard
            title="Avg Migration Time"
            value={isLoading ? "..." : `${avgDuration} min`}
            change="Per report"
            changeType="neutral"
            icon={<Clock className="w-5 h-5" />}
          />
        </div>

        {/* Source Cards */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-4">Choose Migration Source</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {migrationSources.map((source) => (
              <SourceCard
                key={source.id}
                sourceId={source.id}
                title={source.title}
                description={source.description}
                icon={source.icon}
                color={source.color}
                onClick={() => handleSourceClick(source.id)}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity Table (Wired to dynamic data) */}
        <div className="mt-8">
          <h2 className="text-base font-semibold text-foreground mb-4">Recent Migrations</h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Report</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Source</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Loading migrations...
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No migrations found. Start your first one above!
                    </td>
                  </tr>
                ) : (
                  // Map over the first 5 jobs
                  jobs.slice(0, 5).map((job) => (
                    <tr key={job.Id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium">{job.ReportName}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{job.SourcePlatform}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            job.MigrationStatus === "Completed"
                              ? "bg-green-100 text-green-700"
                              : job.MigrationStatus === "Failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {job.MigrationStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {new Date(job.StartedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TableauAuthModal
        isOpen={showTableauAuth}
        onSuccess={handleTableauAuthSuccess}
        onCancel={() => setShowTableauAuth(false)}
      />
    </AppLayout>
  );
};

export default Dashboard;
